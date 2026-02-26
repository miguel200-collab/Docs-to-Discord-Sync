const DISCORD_WEBHOOK_URL = "Discord_Webhook_Here";

function checkTableUpdates() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const tables = body.getTables();
  
  if (tables.length === 0) return;
  
  const table = tables[0];
  let tableData = "";
  
  // 1. Setup the Days dictionary using the header row
  let scheduleByDay = {};
  let headerRow = table.getRow(0);
  let days = [];
  
  for (let c = 1; c < headerRow.getNumCells(); c++) {
    let dayName = headerRow.getCell(c).getText().trim();
    if (dayName !== "") {
      days.push(dayName);
      scheduleByDay[dayName] = []; // Create an empty list for this day
    }
  }

  // 2. Loop through rows and columns to gather data
  for (let r = 1; r < table.getNumRows(); r++) {
    let timeSlot = table.getRow(r).getCell(0).getText().trim();
    if (!timeSlot) continue; 
    
    // Add raw text to our tracker to detect changes
    tableData += timeSlot; 
    
    for (let c = 1; c < table.getRow(r).getNumCells(); c++) {
      let cellText = table.getRow(r).getCell(c).getText().trim();
      tableData += cellText;
      
      let currentDay = days[c - 1]; // Match column to the day
      
      if (cellText !== "") {
        // Split ONLY by comma to separate different people
        let people = cellText.split(",");
        for (let i = 0; i < people.length; i++) {
          let person = people[i].replace(/\n/g, " ").trim(); // Handle accidental Enters
          if (person !== "") {
            // Format it as "9-10AM: Alice Jones [Al2304]"
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
      if (scheduleByDay[day].length > 0) {
        newScheduleString += `__**${day}**__\n`; // Underlines and bolds the day
        newScheduleString += scheduleByDay[day].join("\n") + "\n\n";
      }
    }
    
    // 5. Send to Discord
    sendToDiscordWebhook(newScheduleString);
    properties.setProperty('previousTableData', tableData);
  }
}
