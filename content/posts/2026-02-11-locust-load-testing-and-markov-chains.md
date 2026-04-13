---
date: '2026-02-11T03:24:14Z'
title: 'Locust Load Testing and Markov Chains'
url: /blog/36
---


I recently read [this blog post on the pains of load testing](https://www.ntietz.com/blog/load-testing-is-hard-but-why/). I want to focus on two pain points pulled right out of the post:

> 1. Most load testing tools support simplistic workloads, and even the complex ones don't let you do everything that's realistically needed to simulate real usage of a web application.

> 2. Writing the test with a simulation of real usage is the hardest part, even if the tools do support what you need.


## A Markov-what?

I also recently used [Locust](https://docs.locust.io/en/stable/) in a load testing scenario at work. We're creating an AI chat agent (a new idea you might not have heard about) and I was tasked with doing some simple load testing.

I didn't want to use the default load testing tools like `ab`, `wrk`, or `vegeta` for the same issues as `1.`. Hitting the chat endpoint and sending a message as quick as possible didn't simulate an end user that well.

In looking through the Locust docs, I found something interesting.

## MarkovTaskSet (See [docs](https://docs.locust.io/en/stable/tasksets.html#markovtaskset-class))

The Locust docs explain it well.

For reference, a task in Locust is a load action (initiate an HTTP request) and a `TaskSet` is a collection of these actions.

> MarkovTaskSet is a TaskSet that defines a probabilistic sequence of tasks. Unlike regular TaskSets where tasks are chosen randomly based on weight, MarkovTaskSets allow you to define specific transitions between tasks with associated probabilities.
> 
> This is useful for modeling user behavior where the next action depends on the current state.

The distinction here is that a task in a regular `TaskSet` can jump to ANY other task. These allow you to narrow down the next Task. The example shows how simple the usage can be:

```python
class ShoppingBehavior(MarkovTaskSet):
    wait_time = constant(1)

    @transition("view_product")
    def browse_catalog(self):
        self.client.get("/catalog")

    @transitions({
        "add_to_cart": 3,
        "browse_catalog": 1,
        "checkout": 1
    })
    def view_product(self):
        self.client.get("/product/1")

    @transitions([
        "view_product",
        "checkout"
    ])
    def add_to_cart(self):
        self.client.post(
            "/cart/add",
            json={"product_id": 1}
        )

    @transition("browse_catalog")
    def checkout(self):
        self.client.post("/checkout")
```

With a couple of state transitions you have a non-trivial user emulation! Check out the interaction graph.

![Markov shopping taskset diagram](/img/posts/36/markov-shopping-locust-taskset.png)

The key part here is that each transitions has a probability of going to a different state. On the aggregate this makes the load a lot more organic. 

I ended up using this to emulate a user that would:
- Browse their profile
- Browse their chats
- Chat with a 10-15s pause to read. There was a 75% chance to send another message or go do another task.

And it wasn't even 100 lines of code! Very very cool. I think the succinct-ness of the solution addresses `2.` very well.

This idea of simple rules for individuals leading to a complex system behavior reminds me of Sebastian Lague's excellent [youtube video on Boids](https://youtu.be/bqtqltqcQhw?si=HgjaoORpcBw4SyUk). It illustrates the concept beautifully in his ever-calm voice. Kinda like a chill teacher assistant who's explaining the subject matter better than the professor ever did.