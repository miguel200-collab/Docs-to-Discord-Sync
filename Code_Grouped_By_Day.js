const DISCORD_WEBHOOK_URL = "Discord_Webhook_Here";

function checkTableUpdates() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const tables = body.getTables();
  
  if (tables.length === 0) return;
  
  const table = tables[0];
  let tableData = "";
  
  // 1. Setup the Days dictionary using the SECOND row (Row 1 instead of 0)
  let scheduleByDay = {};
  let headerRow = table.getRow(1); 
  let days = []; 
  
  for (let c = 1; c < headerRow.getNumCells(); c++) {
    let dayName = headerRow.getCell(c).getText().trim();
    days.push(dayName); 
    if (dayName !== "") {
      scheduleByDay[dayName] = []; 
    }
  }

  // 2. Loop through rows starting at the THIRD row (Row 2 instead of 1)
  for (let r = 2; r < table.getNumRows(); r++) { 
    let timeSlot = table.getRow(r).getCell(0).getText().trim();
    if (!timeSlot) continue; 
    
    tableData += timeSlot; 
    
    for (let c = 1; c < table.getRow(r).getNumCells(); c++) {
      let cellText = table.getRow(r).getCell(c).getText().trim();
      tableData += cellText;
      
      let currentDay = days[c - 1]; 
      
      // SAFETY CHECK: Ensure the cell isn't empty AND the day actually exists
      if (cellText !== "" && currentDay && scheduleByDay[currentDay]) {
        let people = cellText.split(",");
        for (let i = 0; i < people.length; i++) {
          let person = people[i].replace(/\n/g, " ").trim(); 
          if (person !== "") {
            scheduleByDay[currentDay].push(`${timeSlot}: ${person}`);
          }
        }
      }
    }
  }
  
  // 3. Compare with previous state
  const properties = PropertiesService.getDocumentProperties();
  const previousData = properties.getProperty('previousTableData');
  
  if (tableData !== previousData) {
    // 4. Build the new Discord Message String
    let newScheduleString = "**Up-to-date schedule:**\n\n";
    
    for (let i = 0; i < days.length; i++) {
      let day = days[i];
      if (day !== "" && scheduleByDay[day] && scheduleByDay[day].length > 0) {
        newScheduleString += `__**${day}**__\n`; 
        newScheduleString += scheduleByDay[day].join("\n") + "\n\n";
      }
    }
    
    // 5. Send to Discord
    sendToDiscordWebhook(newScheduleString);
    properties.setProperty('previousTableData', tableData);
  }
}

function sendToDiscordWebhook(message) {
  const properties = PropertiesService.getDocumentProperties();
  const messageId = properties.getProperty("discordMessageId");
  
  const payload = JSON.stringify({ content: message });
  
  if (messageId) {
    const patchUrl = DISCORD_WEBHOOK_URL + "/messages/" + messageId;
    const options = {
      method: "patch",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(patchUrl, options);
    
    if (response.getResponseCode() === 200) {
      return; 
    }
  }
  
  const postUrl = DISCORD_WEBHOOK_URL + "?wait=true";
  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(postUrl, options);
  
  if (response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText());
    properties.setProperty("discordMessageId", data.id);
  }
}
