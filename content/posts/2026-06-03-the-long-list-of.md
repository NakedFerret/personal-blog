---
date: '2026-06-03T00:00:00-00:00'
title: "The long list of bad decisions I made for my new SaaS"
url: /blog/39
draft: true
---

I'm about to launch a new analytics SaaS. Easily the biggest project I've ever taken on myself. I don't usually finish ANY projects so this is a big life goal for me.

I have humble goals for myself: get two subscribers by the end of the year. There's six months left to the year so if I can average bringing in a third of a person each month I got that goal in the bag.

## Look ma, no containers

The weird thing about my deployment method is that I opted to segregate tenants into their own VMs instead of their own containers. I'm probably leaving money on the table but I'd rather do it this way since it simplifies security issues relating to tenant isolation.

That said, it's not the only weird part of the architecture. I'm using Svelte not React, and I'm rendering server templates as well. It's almost a homemade server-side rendering setup. The first page waits for the js bundle to load and render, but there's no client side fetching going on for page loads. The backend server provides it as props.

## Did I paint myself into a corner?

So far just with those two decisions I'm going wayy against conventional wisdom. I would have saved way more time if I took off the shelve tech and integrated it together.

But weirdly enough I don't regret my decision at all. I really don't hope I'm sprinting head first into a pole on the road that's staying perfectly in my blindspot. 

To illustrate my point, let's make a giant list of possibly catastrophic decisions.


- Wrote a crude continous deployment process instead of using [Fly.io](https://fly.io)/[Railway](https://railway.com/)/AWS/[exe.dev](https://exe.dev).
- Deploying binaries over SFTP to bare VMs instead of using [Docker](https://www.docker.com/). 
- Wrote my own load generator instead of using [wrk](https://github.com/wg/wrk)/[vegeta](https://github.com/tsenart/vegeta)/[otelgen](https://github.com/krzko/otelgen).
- Deploy using golang and ssh instead of using [ansible](https://docs.ansible.com/projects/ansible/latest/index.html)/[pyinfra](https://github.com/pyinfra-dev/pyinfra).
- Using [goyek](https://github.com/goyek/goyek) as a build system to replace my [just](https://github.com/casey/just) scripts. I could have used [make](https://www.gnu.org/software/make/) here.
- Wrote custom pagination in SQL instead of using an ORM or query builder.
- Web analytics over websockets instead of HTTP events.
- Using the otel collector libraries instead of the [otelcol utility](https://opentelemetry.io/docs/collector/).
- Generating browser client certs without using [openssl](https://www.openssl.org/).
-  Using [Litestream](https://litestream.io/) to continuously back up SQLite to S3 instead of using a managed database. This one is the one I'm most worried about.
- Homemade SSR with Go templates + [Svelte](https://svelte.dev/) mount instead of [Next.js](https://nextjs.org/).
- Using [Incus (LXC)](https://linuxcontainers.org/incus/introduction/) for the dev environment instead of Docker Compose.
- Encrypting production secrets with age+Scrypt passphrase instead of HashiCorp Vault or SOPS. This will be replaced eventually!
- No frontend tests. I got tired of fighting with them. They will eventually come back but after I hire someone full time.
- Embedding the IP-to-country database into the analytics service binary. Avoids consulting another API!
- Using go's crypto/ssh library instead of `ssh-keyscan` when a new VM comes online.


## The zen of using your own tools

I already mentioned I don't regret my decision. A big contributor to that is that it's just so frictionless to work on the project. That's to be expected. I've setup everything exactly how I like it. It feels like walking into an organized workshop with tools you've never seen before haha.
