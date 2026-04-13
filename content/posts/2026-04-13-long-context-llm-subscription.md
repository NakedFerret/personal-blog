---
date: '2026-04-13T18:16:07-03:00'
title: 'Your intuition of LLM token usage might be wrong'
url: /blog/37
---


I just finished a task with GPT-5.4-mini. Here's the session summary from [oh-my-pi (an agent harness)](https://github.com/can1357/oh-my-pi):

```python
Tokens
Input: 3_648_340 
Output: 61_676
```
 
It was a hefty 30 min session. I (we?) mostly tweaked how `Service A` loads two sqlite databases. It now loads them per request instead of once when the service starts up. The agent had to investigate multiple services from the monorepo and update 5 files. I also had to update `Service B` and the deploy script to get `Service B` into my development vm. And finally write documentation for project management purposes.

The token usage might line up with your intuition: an LLM agent mostly reads. 

> *Picture this:* You might have two sessions where you use the same model and the agent reads/writes similar amounts. But it feels like one session eats up a lot more usage than the other. 

If this happens to you, it's because your intuition is wrong. 

The **actual** token usage was the following:

```python
Tokens
Input: 3_648_340
Output: 61_676
Cache Read: 26_257_024
```

The cached reads were a **whole magnitude bigger** than the regular reads! And two magnitudes bigger than the writes. 

> *Your intuition should be:* an LLM mostly reads, barely writes, and it (cache) reads the context in each turn.

To quickly verify this, let's see how the token usage changes with one more message in the conversation. oh-my-pi says the context is at `76.6% of 272k`. That's about `208,352 tokens`. I'll ask it to summarize the changes made without reading any files. This should guarantee the agent just uses the context to provide the answer.

```python
Tokens
Input: 3_648_485       # 145 new tokens.       My message.
Output: 62_030         # 354 new tokens.       The response.
Cache Read: 26_465_408 # 208_384 new tokens.   The context read.


Total: 30_175_923
```

Almost exactly right! 

Limit/usages from each provider are opaque but I'll be dammed if the LLM providers don't factor cache reads into it. Lesson is: **keep your context short to maximize your usage**.
