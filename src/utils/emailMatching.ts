
export const findEmailMatch = (memberName: string, userEmails: string[]): string | undefined => {
  console.log(`Finding email match for member: ${memberName}`);
  
  if (!memberName || !userEmails || userEmails.length === 0) {
    console.log("No member name provided or no user emails available");
    return undefined;
  }
  
  // Special case for Maciej Krzeptowski
  if (memberName.toLowerCase().includes("maciej") && memberName.toLowerCase().includes("krzeptowski")) {
    const maciejEmail = userEmails.find(email => 
      email.toLowerCase().includes("maciej") && 
      (email.toLowerCase().includes("krzeptowski") || email.toLowerCase().includes("krzept"))
    );
    
    if (maciejEmail) {
      console.log(`Found special match for Maciej Krzeptowski: ${maciejEmail}`);
      return maciejEmail;
    }
  }
  
  // Special case for Jan Jurga
  if (memberName.toLowerCase().includes("jan jurga")) {
    const janEmail = userEmails.find(email => 
      email.toLowerCase().includes("jan") && email.toLowerCase().includes("jurga")
    );
    if (janEmail) {
      console.log(`Found special match for Jan Jurga: ${janEmail}`);
      return janEmail;
    }
  }
  
  const normalizedName = memberName.toLowerCase().trim();
  const nameParts = normalizedName.split(' ');
  
  // Try exact match (first.last@domain.com)
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    const exactMatch = userEmails.find(email => {
      const normalizedEmail = email.toLowerCase();
      return normalizedEmail.includes(`${firstName}.${lastName}`) || 
             normalizedEmail.includes(`${lastName}.${firstName}`);
    });
    
    if (exactMatch) {
      console.log(`Found exact email match: ${exactMatch}`);
      return exactMatch;
    }
    
    // Look for underscore format (first_last@domain.com)
    const underscoreMatch = userEmails.find(email => {
      const normalizedEmail = email.toLowerCase();
      return normalizedEmail.includes(`${firstName}_${lastName}`) || 
             normalizedEmail.includes(`${lastName}_${firstName}`);
    });
    
    if (underscoreMatch) {
      console.log(`Found underscore email match: ${underscoreMatch}`);
      return underscoreMatch;
    }
  }
  
  // Try name parts matching
  for (const email of userEmails) {
    const normalizedEmail = email.toLowerCase();
    const userName = normalizedName.replace(/\s+/g, '.');
    const userNameNoSpace = normalizedName.replace(/\s+/g, '');
    
    if (normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace)) {
      console.log(`Found partial email match: ${email}`);
      return email;
    }
  }
  
  // Last resort - check if any name part is in the email
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    for (const email of userEmails) {
      const normalizedEmail = email.toLowerCase();
      
      // If both first name and last name are in the email
      if (normalizedEmail.includes(firstName) && normalizedEmail.includes(lastName)) {
        console.log(`Found name parts in email: ${email}`);
        return email;
      }
    }
  }
  
  console.log(`No email match found for ${memberName}`);
  return undefined;
};
