---

## What is PhantomUI?

PhantomUI is a tool that lets AI test your website for you.

Normally when you want to test a button or a form, you have to write code that says
"find this button, click it, check if this text appears" — and it breaks every time
someone changes the design.

PhantomUI works differently. You put small labels on your HTML elements
(like name tags). The AI reads those labels, understands what each element does,
and figures out how to test it on its own.

You just say: "Test my login page" — and it does everything automatically.
It clicks buttons, fills forms, checks results, and gives you a report.

Think of it like hiring a QA tester who never sleeps, never complains,
and already knows how your UI works.

---

## LinkedIn Post

---

I just published my first npm package 🎉

It's called @phantomui/sdk — and it makes UI testing actually fun.

---

Here's the problem I kept running into:

You write a test that clicks a button.
A teammate renames the button.
Your test breaks.
You spend an hour fixing it instead of building.

Sound familiar?

---

So I built something different.

Instead of fragile CSS selectors, you add simple tags to your HTML:

```html
<input
  data-ai-id="login-email"
  data-ai-label="Email Address"
/>

<button
  data-ai-id="login-submit"
  data-ai-label="Sign In"
/>
```

That's it. Claude AI reads these tags, understands your UI, and writes + runs the tests for you automatically.

No more broken selectors.
No more manual test scripts.
Just tell Claude what to test — it handles the rest.

---

Install it in any project:

npm install @phantomui/sdk

Works with React, Vue, Angular, and plain HTML.
TypeScript support included. Zero frontend dependencies.

---

I'm just getting started with this — would love your feedback.

What's the most painful part of UI testing for you?

---

🔗 npm → npmjs.com/package/@phantomui/sdk
💻 GitHub → github.com/ibrahim-abi/phantomui

#OpenSource #JavaScript #AI #Testing #WebDev #React #Vue #npm
