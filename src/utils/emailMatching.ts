
export const findEmailMatch = (memberName: string, userEmails: string[]): string | undefined => {
  console.log(`Finding email match for member: ${memberName}`);
  
  if (!memberName || !userEmails || userEmails.length === 0) {
    console.log("No member name provided or no user emails available");
    return undefined;
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
  
  console.log(`No email match found for ${memberName}`);
  return undefined;
};
