---
date: '2026-06-09T00:00:00-00:00'
title: 'Almost realtime deploy logs in my SaaS'
url: /blog/39
---

A totally unnecessary but cool change to my internal tools: realtime deploy lgos in my SaaS.

**TODO: Example of a deployment from DigitalOcean**

{{< toc >}}

## Storage for deploy logs: a sqlite column.

Each tenant's host is provisioned and configured by a single internal service. This one service keeps a sqlite DB the the deploy history. The deployment logs are just stored as text in the sqlite db.

To prevent the service's individual log lines from mixing between deploys, we only write the deploy logs to stdout and to the db when it's all finished. 

## The storage approach

To idea here is simple. We already have a string buffer inside the service for each deploy. Each second, we could flush the buffer to sqlite. This works but each second the buffer grows and each subsequent write is larger than the last. This could be costly with long-running deployments that print a lot of logs. 

We might be pre-optimizing here, but we could flush to the DB only the bits that have been appended since the last flush. Using the following SQL

```sql
UPDATE deployments SET logs = logs || ? WHERE deployment_id = ?
```

And it's a pretty small golang struct for this functionality:

```go
package deploy

import (
	"bytes"
	"sync"
)

type logBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
	off int
}

func (b *logBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *logBuffer) FlushDelta() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	data := b.buf.Bytes()
	if b.off >= len(data) {
		return ""
	}
	delta := string(data[b.off:])
	b.off = len(data)
	return delta
}

func (b *logBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}
```

## The presentation

This one is a bit trickier. I just use htmx to poll the log contents in the backend html template.

```go-html-template
<div id="deploy-content" 
  {{if not .Deployment.DeployEnd}} 
   	hx-get="/deployments/{{.Deployment.DeploymentID}}/content" 
    hx-trigger="every 1s" 
    hx-swap="outerHTML"
  {{end}}
>
```

The template that renders the page includes <html>, <body>, and <head>. We need to reference the child template to make it work:

```go-html-template
<body>
  <h1>Deployment {{.Deployment.DeploymentID}}</h1>
  <div id="deploy-content" 
    hx-get="/deployments/{{.Deployment.DeploymentID}}/content" 
    hx-trigger="load every 1s" 
    hx-swap="outerHTML"
  >
    <span>Loading…</span>
  </div>
</body>
```

It's hacky but it works.

## Future improvements

This approach hijacks my scroll when I'm looking at logs _during_ an active deploy. I'll probably swap out htmx for something more integrated in the future. For now this works ok.

`logBuffer` is probably not optimal. I'm not familiar enough with go to understand the performance implications of the buffer so that's something to look into in the future.
