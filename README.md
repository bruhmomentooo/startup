# Task Tracker

[My Notes](notes.md)

Task tracker is built for those who often forget tasks or activities that need to be fulfilled or for the sake of remembering when that activity was performed. It will keep track of those dates that tasks have been completed for future reference and to provide a frequency of how often a task is performed.

## 🚀 Specification Deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

### Elevator pitch

Do you ever feel overwhelmed with the amount of activities that you have to accomplish? Maybe you've even forgotten when you last changed your oil or fertilized your lawn. That's where the new Task Tracker app comes in, helping you easily remember, track, and manage everything that you need to do. By keeping track of recurring and reoccuring events, the app helps reduce the stress of remembering them on your own. Each time a task is completed, it can be simply checked off, and the app will record the date and time for easy reference. The app also offers customizable reminders, ensuring you never forget an important task again.

### Design

![tasktrackerdiagram](https://github.com/user-attachments/assets/e954c184-6c8d-4cb8-bb70-f4e9e5786224)


Pictured above and to the right of the white board is the diagram of how users will be able to use the app, and also how their login and task information and data is stored. To the left is the basic web interface that users will come into contact with. It displays how the app will function and all the different features.

### Key features

- Account creation and storing login information
- Secure login over HTTPS
- Creation of tasks in realtime
- Editing tasks
- Removing tasks
- Marking off tasks and storing date/task completion
- Ability to receive notifications when a task is due
- Ability to add tasks to Google Calendar
- Set recurring task date
- Tells the frequency of each task

### Technologies

I am going to use the required technologies in the following ways:

- **HTML** - Uses correct HTML structure for application. Two HTML pages with three additional pop-up screens. Included:
    * Login page
    * Task tracker main page
        - Task creation pop-up
        - Task editor pop-up
        - Notifications pop-up
- **CSS** - Application styling with photos, good whitespace, color and contrast.
- **React** - Provides login and account creation, new task creation and editing, backend endpoint calls.
- **Service** - Backend service with endpoints for:
     * retrieving task information (task name, dates, frequency)
     * sumbitting tasks
     * ability to connect with Google calendar [Google Calendar API](https://developers.google.com/workspace/calendar/api/guides/overview).
     * register, login and logout users. Credentials securely stored in database.
- **DB/Login** - Store authentication information, users, tasks, and dates in the database.
- **WebSocket** - Notifications from the database for when a task is due.

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Server deployed and accessible with custom domain name** - [My server link](https://yourdomainnamehere.click).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **HTML pages** - I did not complete this part of the deliverable.
- [ ] **Proper HTML element usage** - I did not complete this part of the deliverable.
- [ ] **Links** - I did not complete this part of the deliverable.
- [ ] **Text** - I did not complete this part of the deliverable.
- [ ] **3rd party API placeholder** - I did not complete this part of the deliverable.
- [ ] **Images** - I did not complete this part of the deliverable.
- [ ] **Login placeholder** - I did not complete this part of the deliverable.
- [ ] **DB data placeholder** - I did not complete this part of the deliverable.
- [ ] **WebSocket placeholder** - I did not complete this part of the deliverable.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Header, footer, and main content body** - I did not complete this part of the deliverable.
- [ ] **Navigation elements** - I did not complete this part of the deliverable.
- [ ] **Responsive to window resizing** - I did not complete this part of the deliverable.
- [ ] **Application elements** - I did not complete this part of the deliverable.
- [ ] **Application text content** - I did not complete this part of the deliverable.
- [ ] **Application images** - I did not complete this part of the deliverable.

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Bundled using Vite** - I did not complete this part of the deliverable.
- [ ] **Components** - I did not complete this part of the deliverable.
- [ ] **Router** - I did not complete this part of the deliverable.

## 🚀 React part 2: Reactivity deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **All functionality implemented or mocked out** - I did not complete this part of the deliverable.
- [ ] **Hooks** - I did not complete this part of the deliverable.

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Node.js/Express HTTP service** - I did not complete this part of the deliverable.
- [ ] **Static middleware for frontend** - I did not complete this part of the deliverable.
- [ ] **Calls to third party endpoints** - I did not complete this part of the deliverable.
- [ ] **Backend service endpoints** - I did not complete this part of the deliverable.
- [ ] **Frontend calls service endpoints** - I did not complete this part of the deliverable.
- [ ] **Supports registration, login, logout, and restricted endpoint** - I did not complete this part of the deliverable.


## 🚀 DB deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Stores data in MongoDB** - I did not complete this part of the deliverable.
- [ ] **Stores credentials in MongoDB** - I did not complete this part of the deliverable.

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [ ] **Backend listens for WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Frontend makes WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **Data sent over WebSocket connection** - I did not complete this part of the deliverable.
- [ ] **WebSocket data displayed** - I did not complete this part of the deliverable.
- [ ] **Application is fully functional** - I did not complete this part of the deliverable.
