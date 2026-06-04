---
date: '2026-05-02T00:00:00-00:00'
title: 'LLMs code like a "savant junior". I treat it like one'
url: /blog/38
draft: true
---

I don't know who came up with that monicker but it's pretty apt, even if condecending in tone.

Working with LLMs in agent harnesses can be REALLY hit or miss. In one part I swear that the quality of inference apis using the same APIs varies. I read in a hacker news comment that OpenAI doesn't change their weights, but z.ai has [released a blog post explainin KV-cache issues at high load that lead to garbage output](https://z.ai/blog/scaling-pain).

Anyways, I can't really prove any of that at the moment. After more than a year of agentic LLM usage I do notice some approaches work better than others.

For example, giving an agent a high-level overview and telling it to complete the task has given me something I'm not happy with the vast majority of the time. The issues are many with this approach. The implementation is incorrect, inscrutable, repeated, unperformant. The tests are hopeful, incorrect, unit instead of integration, integration instead of unit. The frontend output is usually good, but I have a lot less opinions here.

To give an example, I just told `gpt-5.4-mini` to implement a new API endpoint to an ingestion service. It created a new router for that (good), but it moved the health and normal ingestions endpoint into this new router (bad). Rookie mistake. These things might seem inocuous but it's these issues that balloon to maintenance nightmares later on. Better tackle it at the source.

## A slice, a chat, the shape, the tests.

I'll instead plan out the implementation steps for that objective myself. I know. Ew gross critical thinking. However,

> You can't delegate everything to the LLM. There must be some human design. It's not a side-product of a creation. **It's the essence.**

This includes implementations as well. Think about it like this. If you were working on a team of similarly skilled people and you shoved them each in a room to come up with a solution, you'd have many different solutions. They would all have their own constraints, downsides, and benefits. Do you really want to delegate that to an LLM? It kinds of affects all the decisions that come after. Once again, **It's the essence.**

### The slice

But we also can't give the LLM more than it can chew. You...really can't do that with a junior either. There's pitfalls then there's unkwown pitfalls. You can outline the first but you'll always miss the latter.

A small focused slice is what I prefer. A new endpoint. A new database table. Always some integration tests. Something that actually exercises the system since LLMs are great at pretending things are done. 

I try to outline exactly what I want:

> Read the last 5 uow for otelgen.
> 
> I'd like to add the ability to backfill user analytics sessions to [the datbase backfill system]. We could make a new emitter that writes to the clickhouse directly, or we could add this backfill functionality to the analytics-recv service.
>  I prefer doing the later. 
> 
> The approach I'm thinking of is to define an HTTP endpoint that takes a batch of `CompletedUserTrace` objects. That should be enough of guidance to implement the endpoint.
> 
> Thoughts?

The `Thoughts?` has a two-fold purpose. I usually use it as a terse signal that I don't want the agent to code. These models can be trigger-happy and I found this reliably makes them chat and not code. It's like they can't help themselves but talk.

### The chat

The other reason to use `Thoughts?` is to gauge the understanding of the execution plan. I would do the same thing with someone else. I could miscommunicate or misrepresent my idea.

> ## Assistant
> 
> ...
> 
> Your HTTP batch idea is directionally right, but I would not make the endpoint accept only raw `CompletedUserTrace` objects without an envelope. It needs at least a batch wrapper with source identity, time range, and an idempotency key or dedupe token, because backfill is exactly where retries and partial replays show up. I would also keep the endpoint narrow: accept completed traces, validate them, and let `analytics-recv` own normalization and ClickHouse writes. That keeps otelgen as the producer of completed user sessions and keeps ingestion semantics in the >service that already owns analytics ingestion.
>
> If you want, I can turn that into a concrete session plan and UoW entry for the `analytics-recv` >backfill endpoint.
>
>## User
>
> I don't want the wrapper on the endpoint. Just validation that the batch is up to 1k items. This >backfill is only used for testing.
>
>I agree with the rest of the restrictions. 
>
>The availability of the endpoint can be controlled by an ENV var.
>
> How would you test this endpoint. Which are the highest value cases?

Here's
