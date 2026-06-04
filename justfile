set windows-shell := ['nu', '-c']

build:
    hugo build

deploy: build
    bunx wrangler pages deploy

watch:
    hugo server --watch --port 12000

new-typst title:
    hugo new content/posts/$(date +%Y-%m-%d)-{{ title }}.typst

new-md title:
    hugo new content/posts/$(date +%Y-%m-%d)-{{ title }}.md
