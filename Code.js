const WEBHOOK_URL = "Discord_Webhook_Here"

function checkTableUpdates() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const tables = body.getTables();

  if (tables.length === 0) return;

  const table = tables[0]; //looks at very first table in document. Iterating to monday for multiple tables or until desired word is found.
  const numRows = table.getNumRows();

  let currentState = {};
  let schedule = {};
  let headers = [];
  
  // 1. Find Header Row
  let headerRowIdx = 1;
  for (let r = 0; r < numRows; r++) {
     let cellText = table.getCell(r, 1).getText().trim();
     if (cellText === "Monday") {
         headerRowIdx = r;
         break;
     }
  }

  // 2. Map Days
  for (let c = 1; c < table.getRow(headerRowIdx).getNumCells(); c++) {
    headers.push(table.getCell(headerRowIdx, c).getText().trim());
  }

  // 3. Map Times and Group by Person
  for (let r = headerRowIdx + 1; r < numRows; r++) {
    let timeSlot = table.getCell(r, 0).getText().trim();
    
    for (let c = 1; c < table.getRow(r).getNumCells(); c++) {
      let cellText = table.getCell(r, c).getText().trim();
      let day = headers[c-1];
      
      // Save for change detection
      let cellKey = timeSlot + "||" + day; 
      currentState[cellKey] = cellText;

      // Group for the Discord message
      if (cellText !== "") {
        // Split by comma or newline in case two names are in one box
        let people = cellText.split(/,|\n/);
        for (let i = 0; i < people.length; i++) {
          let person = people[i].trim();
          if (person !== "") {
            if (!schedule[person]) {
              schedule[person] = [];
            }
            schedule[person].push(day + " " + timeSlot);
          }
        }
      }
    }
  }

  const props = PropertiesService.getDocumentProperties();
  const previousStateStr = props.getProperty('tableState');
  const currentStateStr = JSON.stringify(currentState);
  const messageId = props.getProperty('masterMessageId');

  // 4. If nothing changed AND we already have a master message, do nothing
  if (previousStateStr === currentStateStr && messageId) {
    Logger.log("No changes detected.");
    return;
  }

  // 5. Build the text for Discord
  let description = "Up-to-date schedule:\n\n";
  
  // Sorts names alphabetically 
  let names = Object.keys(schedule).sort();
  for (let i = 0; i < names.length; i++) {
    let person = names[i];
    let times = schedule[person].join(", ");
    description += "**" + person + "**\n" + times + "\n\n";
  }

  // In case we reach Discords character limit
  if (description.length > 4000) {
      description = description.substring(0, 4000) + "\n...[Truncated]";
  }

  const payload = {
    "content": "🚨 **MakerLAB Office Hours** 🚨\n",
    "embeds": [{
      "color": 3447003,
      "description": description
    }]
  };

  // 6. Send or Edit the Discord Message
  if (!messageId) {
    // Send a brand new message and grab its ID
    const options = {
      "method": "post",
      "contentType": "application/json",
      "payload": JSON.stringify(payload)
    };
    // The ?wait=true is required to get the message ID back from Discord
    const response = UrlFetchApp.fetch(WEBHOOK_URL + "?wait=true", options);
    const json = JSON.parse(response.getContentText());
    props.setProperty('masterMessageId', json.id);
    Logger.log("Created new master message.");
  } else {
    // Edit the existing message
    const options = {
      "method": "patch",
      "contentType": "application/json",
      "payload": JSON.stringify(payload)
    };
    
    let editUrl = WEBHOOK_URL + "/messages/" + messageId;
    
    try {
      UrlFetchApp.fetch(editUrl, options);
      Logger.log("Updated existing master message.");
    } catch (e) {
      // If someone accidentally deletes the Discord message, we reset the ID
      Logger.log("Failed to edit. Message may have been deleted.");
      props.deleteProperty('masterMessageId');
    }
  }

  // 7. Save the new state
  props.setProperty('tableState', currentStateStr);
}

