# Google-table-to-Discord
Google Apps Script to automatically send Google Doc table changes to a Discord Webhook.

# MakerLAB Discord Automator 📅

A serverless integration that automatically synchronizes a schedule from a Google Doc table directly to a Discord server. 

## 🎯 The Goal
MakerLAB needed an automated way to communicate changing Office Hours to students on Discord. This project turnins a standard Google Doc table into a data source that feeds directly into Discord.

## 🏗️ System Architecture
This project uses a lightweight, serverless architecture to move data from Google to Discord:
1. **Data Source (UI):** A standard Google Doc containing a formatted table. 
2. **Compute & Logic:** Google Apps Script reads the Document Object Model (DOM), parses the table into a JSON object, and groups available hours by staff member.
3. **State Management:** The script utilizes Google's `PropertiesService` to store the previous state of the table and the specific Discord Message ID, allowing it to compare versions and know exactly which message to edit.
4. **Automation:** A Google Apps Script Time-driven Trigger acts as a cron job, silently running the script every 30 minutes.
5. **API Delivery:** If a change is detected, the script constructs an embed payload and sends an HTTP `PATCH` request to a Discord Webhook, silently updating the live roster in the channel.

## ✨ Features
* **Silent Background Checking:** Runs on a time trigger to check for updates without eating up Google API quotas.
* **Smart Parsing:** Reads a standard grid table (Times on the Y-axis, Days on the X-axis) and groups hours by individual staff members.
* **Master Message Editing:** Uses `PATCH` requests to continuously edit a single Discord message, keeping the channel clean and free of spam.
* **Auto-Formatting:** Automatically alphabetizes staff names and lists their available times clearly.

## 📸 Screenshots
* Google Doc Table Setup:


* Discord Message:


## 🚀 Setup Instructions

### 1. Discord Preparation
1. Go to your Discord Server Settings > Integrations > Webhooks.
2. Create a new Webhook, assign it to your desired update channel (e.g., `#office-hours`), and **Copy the Webhook URL**.

### 2. Google Doc Preparation
1. Create a **dedicated** Google Doc for your schedule (see Best Practices below).
2. Insert a table. 
   * The top row must contain the days of the week (starting with "Monday" in the second column).
   * The first column must contain the time slots.
   * The intersecting cells should contain the names of the staff members available at those times (separated by commas or new lines if there are multiple).

### 3. Apps Script Installation
1. In your Google Doc, go to **Extensions > Apps Script**.
2. Delete any existing code and paste the contents of `Code.js` from this repository.
3. Replace `"YOUR_DISCORD_WEBHOOK_URL_HERE"` at the top of the script with your actual webhook URL.
4. Save the project.

### 4. Initialization & Triggers
1. **Set the Baseline:** Run the `checkTableUpdates` function manually one time in the Apps Script editor. You will need to accept Google's authorization prompts. This saves the initial state of the table and generates the first master message in Discord.
2. **Automate It:** Click the **Triggers** icon (alarm clock) on the left menu. Add a new trigger to run `checkTableUpdates` as a **Time-driven** event, checking every **15 or 30 minutes**.

## ⚠️ Best Practices & Limitations
* **The Dedicated Document Rule:** This script is programmed to read the *very first table* it finds in the document (`tables[0]`). To prevent the script from breaking, **do not add other tables above the schedule**. It is highly recommended to use a standalone Google Doc solely for this schedule to avoid accidental formatting errors from other collaborators.
* **Text and Images:** Paragraphs, titles, and images placed above or below the table are completely ignored by the script and will not cause any issues.

  
