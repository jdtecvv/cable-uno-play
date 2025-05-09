import { XMLTVChannel, XMLTVProgram, XMLTVData } from "../types";

/**
 * Parses XMLTV data from a string
 * @param xmlStr - XMLTV content as a string
 * @returns Parsed XMLTV data
 */
export function parseXMLTV(xmlStr: string): XMLTVData {
  // Create a parser and parse the XML string
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("XML parsing error: " + parserError.textContent);
  }
  
  const result: XMLTVData = {
    channels: [],
    programs: []
  };
  
  // Parse channels
  const channelElements = xmlDoc.querySelectorAll("channel");
  channelElements.forEach(channelElem => {
    const channel: XMLTVChannel = {
      id: channelElem.getAttribute("id") || "",
      displayName: channelElem.querySelector("display-name")?.textContent || ""
    };
    
    // Parse icon if present
    const iconElem = channelElem.querySelector("icon");
    if (iconElem && iconElem.getAttribute("src")) {
      channel.icon = iconElem.getAttribute("src") || undefined;
    }
    
    // Parse URL if present
    const urlElem = channelElem.querySelector("url");
    if (urlElem) {
      channel.url = urlElem.textContent || undefined;
    }
    
    result.channels.push(channel);
  });
  
  // Parse programs
  const programElements = xmlDoc.querySelectorAll("programme");
  programElements.forEach(programElem => {
    const program: XMLTVProgram = {
      channel: programElem.getAttribute("channel") || "",
      start: parseXMLTVDate(programElem.getAttribute("start") || ""),
      stop: parseXMLTVDate(programElem.getAttribute("stop") || ""),
      title: programElem.querySelector("title")?.textContent || ""
    };
    
    // Parse description if present
    const descElem = programElem.querySelector("desc");
    if (descElem) {
      program.description = descElem.textContent || undefined;
    }
    
    // Parse category if present
    const categoryElem = programElem.querySelector("category");
    if (categoryElem) {
      program.category = categoryElem.textContent || undefined;
    }
    
    // Parse language if present
    const langElem = programElem.querySelector("language");
    if (langElem) {
      program.language = langElem.textContent || undefined;
    }
    
    // Parse icon if present
    const iconElem = programElem.querySelector("icon");
    if (iconElem && iconElem.getAttribute("src")) {
      program.icon = iconElem.getAttribute("src") || undefined;
    }
    
    result.programs.push(program);
  });
  
  return result;
}

/**
 * Parses XMLTV date format to JavaScript Date
 * XMLTV dates are typically in the format YYYYMMDDHHMMSS +0000
 * @param dateStr - XMLTV date string
 * @returns JavaScript Date object
 */
function parseXMLTVDate(dateStr: string): Date {
  // Handle if the dateStr is empty
  if (!dateStr) {
    return new Date();
  }
  
  try {
    // Extract the basic date components
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(8, 10));
    const minute = parseInt(dateStr.substring(10, 12));
    const second = dateStr.length >= 14 ? parseInt(dateStr.substring(12, 14)) : 0;
    
    // Create a date in UTC
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    
    // Handle timezone if present (format: +0000 or -0500)
    if (dateStr.length >= 20) {
      const tzSign = dateStr.charAt(15) === '+' ? 1 : -1;
      const tzHours = parseInt(dateStr.substring(16, 18));
      const tzMinutes = parseInt(dateStr.substring(18, 20));
      
      // Adjust the date for the timezone
      const tzAdjustment = tzSign * ((tzHours * 60) + tzMinutes) * 60 * 1000;
      date.setTime(date.getTime() - tzAdjustment);
    }
    
    return date;
  } catch (error) {
    console.error("Error parsing XMLTV date:", dateStr, error);
    return new Date(); // Return current date as fallback
  }
}

/**
 * Formats a JavaScript Date object to XMLTV date format
 * @param date - JavaScript Date object
 * @returns XMLTV formatted date string
 */
export function formatXMLTVDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1); // JS months are 0-based
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());
  
  // Format as YYYYMMDDHHMMSS +0000 (UTC)
  return `${year}${month}${day}${hour}${minute}${second} +0000`;
}
