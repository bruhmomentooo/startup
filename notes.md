# CS 260 Notes

[My startup - Simon](https://simon.cs260.click)

## Assignment 1

I learned a lot about Github and how to access the different features that it has and utilize them. I am excited to learn more about this and use it in this CS class. I learned how to access Git from the command line and also VS Code, which should be handy in the future to be able to push, pull and commit. I had to work through a couple things on my computer but it was pretty fun and interesting to figure out.

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## AWS

I don't have an AWS yet, but it will be up and running here soon.

## Caddy

WIP

## HTML

It is important to have navigation links between the pages and to think like the user when designing the website structure. You want to always test the edge cases and desgin each piece and bit carefully and plan how to use each thing in the future.

## CSS

![https___dev-to-uploads s3 amazonaws com_uploads_articles_18sfy7anxl7uj5soub2i](https://github.com/user-attachments/assets/cb614a2f-9cb0-409b-a592-9f9567ae90c2)


## React Part 1: Routing

WIP

## React Part 2: Reactivity

WIP

## Midterm Review

🟧 HTML

1. <link> element
→ Used inside <head> to link external resources (like a CSS stylesheet).
Example:

<link rel="stylesheet" href="style.css">


2. <div> tag
→ A generic block-level container used to group content for layout or styling.

3. <span> default display
→ Default display value is inline.

4. Display an image with a hyperlink
→ Wrap the <img> inside an <a> tag:

<a href="https://example.com">
  <img src="pic.jpg" alt="Example">
</a>


5. Opening HTML tags:

Paragraph: <p>

Ordered list: <ol>

Unordered list: <ul>

1st-level heading: <h1>

2nd-level heading: <h2>

3rd-level heading: <h3>

6. Declare document type as HTML5
→ <!DOCTYPE html>

🟩 CSS

7. Difference between #title and .grid
→ #title selects an element with id="title".
→ .grid selects all elements with class="grid".

8. Difference between padding and margin
→ padding: space inside the element’s border.
→ margin: space outside the element’s border.

9. CSS to make all <div> elements red

div {
  background-color: red;
}


10. CSS box model order (inner → outer):
content → padding → border → margin

11. Set only “trouble” text to green:

<p><span class="green">trouble</span>double</p>

.green {
  color: green;
}


12. Padding CSS example explanation:
If you see padding: 10px 20px; →
Top & bottom = 10px, left & right = 20px.

13. Images displayed using flex
→ Images will line up horizontally by default, evenly spaced if justify-content is used. Example:

.container {
  display: flex;
}

🟦 JavaScript

14. Arrow function declaration example:

const add = (a, b) => a + b;


→ Defines a function in concise form; same as function add(a, b) { return a + b; }.

15. map example output:

[1, 2, 3].map(x => x * 2);


→ [2, 4, 6]

16. getElementById + addEventListener:

document.getElementById("btn").addEventListener("click", () => {
  console.log("Button clicked!");
});


→ When the element with id="btn" is clicked, logs “Button clicked!”.

17. Line of JS using a # selector:

document.querySelector("#title");


→ Selects the element with id="title".

18. Select element with id “byu” and make it green:

document.getElementById("byu").style.color = "green";


19. Correct syntax examples:

if (condition) { ... } else { ... }

for (let i=0; i<5; i++) { ... }

while (x < 10) { ... }

switch(x) { case 1: ...; break; default: ...; }

20. Create a JavaScript object:

const person = { name: "Luke", age: 20 };


21. Add new properties to objects?
✅ Yes.

person.city = "Provo";


22. Include JavaScript in HTML:

<script src="script.js"></script>


23. Change “animal” to “crow” but leave “fish”:

<p id="animal">animal</p>
<p>fish</p>

document.getElementById("animal").textContent = "crow";


24. for loop + console.log output example:

for (let i = 0; i < 3; i++) console.log(i);


→ Logs 0, 1, 2.

25. Promises example output:

Promise.resolve("done").then(console.log);


→ Logs "done" asynchronously.

🟨 DOM

26. Which are true about the DOM:
✅ It represents the HTML structure as a tree.
✅ It allows JavaScript to modify HTML and CSS dynamically.
✅ It’s created by the browser when the page loads.

🟧 Linux / Networking

27. Console command meanings:

chmod: change file permissions

pwd: print working directory

cd: change directory

ls: list files

vim, nano: text editors

mkdir: make directory

mv: move or rename file

rm: remove file

man: manual/help pages

ssh: connect to remote shell

ps: show running processes

wget: download from web

sudo: run as superuser/admin

28. Command that creates a remote shell session:
→ ssh

29. ls -la true statement:
→ Lists all files (including hidden) in long format with permissions, owner, size, and date.

30. Domain parts for banana.fruit.bozo.click:

Top-level domain (TLD): .click

Root domain: bozo.click

Subdomain: banana.fruit

31. HTTPS certificate necessity:
✅ Yes — a web certificate is required for HTTPS.

32. DNS A record facts:
✅ Points to an IP address, not another A record (it can’t alias).

33. Reserved ports:

443 → HTTPS

80 → HTTP

22 → SSH
