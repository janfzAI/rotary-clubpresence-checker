
export const findEmailMatch = (memberName: string, userEmails: string[]): string | undefined => {
  console.log(`Finding email match for member: ${memberName}`);
  
  if (!memberName || !userEmails || userEmails.length === 0) {
    console.log("No member name provided or no user emails available");
    return undefined;
  }
  
  // Special case for specific individuals
  // Explicit special cases for known people with potential conflicts
  if (memberName.toLowerCase().includes("krzysztof") && memberName.toLowerCase().includes("dokowski")) {
    // Specyficzny przypadek dla "Krzysztof Dokowski" - szukamy konkretnie email z "dokowski"
    const email = userEmails.find(email => 
      email.toLowerCase().includes("dokowski")
    );
    if (email) {
      console.log(`Found exact match for Krzysztof Dokowski: ${email}`);
      return email;
    }
    
    // Próba znalezienia email zawierającego zarówno imię jak i nazwisko
    const backupEmail = userEmails.find(email => 
      email.toLowerCase().includes("krzysztof") && 
      email.toLowerCase().includes("dokowski")
    );
    
    if (backupEmail) {
      console.log(`Found backup match for Krzysztof Dokowski: ${backupEmail}`);
      return backupEmail;
    }
  }
  
  if (memberName.toLowerCase().includes("krzysztof") && memberName.toLowerCase().includes("meisinger")) {
    // Specyficzny przypadek dla "Krzysztof Meisinger" - szukamy konkretnie email z "meisinger"
    const email = userEmails.find(email => 
      email.toLowerCase().includes("meisinger")
    );
    if (email) {
      console.log(`Found exact match for Krzysztof Meisinger: ${email}`);
      return email;
    }
    
    // Próba znalezienia email zawierającego zarówno imię jak i nazwisko
    const backupEmail = userEmails.find(email => 
      email.toLowerCase().includes("krzysztof") && 
      email.toLowerCase().includes("meisinger")
    );
    
    if (backupEmail) {
      console.log(`Found backup match for Krzysztof Meisinger: ${backupEmail}`);
      return backupEmail;
    }
  }
  
  // Special case for Maciej Krzeptowski
  if (memberName.toLowerCase().includes("maciej") && memberName.toLowerCase().includes("krzeptowski")) {
    const maciejEmail = userEmails.find(email => 
      email.toLowerCase().includes("krzept")
    );
    
    if (maciejEmail) {
      console.log(`Found special match for Maciej Krzeptowski: ${maciejEmail}`);
      return maciejEmail;
    }
    
    // Próba znalezienia email zawierającego zarówno imię jak i nazwisko
    const backupEmail = userEmails.find(email => 
      email.toLowerCase().includes("maciej") && 
      (email.toLowerCase().includes("krzeptowski") || email.toLowerCase().includes("krzept"))
    );
    
    if (backupEmail) {
      console.log(`Found backup match for Maciej Krzeptowski: ${backupEmail}`);
      return backupEmail;
    }
  }
  
  // Special case for Jan Jurga
  if (memberName.toLowerCase().includes("jan jurga")) {
    const janEmail = userEmails.find(email => 
      email.toLowerCase().includes("jurga")
    );
    if (janEmail) {
      console.log(`Found special match for Jan Jurga: ${janEmail}`);
      return janEmail;
    }
    
    // Próba znalezienia email zawierającego zarówno imię jak i nazwisko
    const backupEmail = userEmails.find(email => 
      email.toLowerCase().includes("jan") && email.toLowerCase().includes("jurga")
    );
    
    if (backupEmail) {
      console.log(`Found backup match for Jan Jurga: ${backupEmail}`);
      return backupEmail;
    }
  }
  
  // Special case for Leszek Zdawski
  if (memberName.toLowerCase().includes("leszek") && memberName.toLowerCase().includes("zdawski")) {
    const leszekEmail = userEmails.find(email => 
      email.toLowerCase().includes("zdawski")
    );
    if (leszekEmail) {
      console.log(`Found special match for Leszek Zdawski: ${leszekEmail}`);
      return leszekEmail;
    }
    
    // Próba znalezienia email zawierającego zarówno imię jak i nazwisko
    const backupEmail = userEmails.find(email => 
      email.toLowerCase().includes("leszek") && email.toLowerCase().includes("zdawski")
    );
    
    if (backupEmail) {
      console.log(`Found backup match for Leszek Zdawski: ${backupEmail}`);
      return backupEmail;
    }
  }
  
  const normalizedName = memberName.toLowerCase().trim();
  const nameParts = normalizedName.split(' ');
  
  // Try full name exact match first (requires both first and last name in email)
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    // Look for emails containing BOTH first AND last name for more precise matching
    const exactFullNameMatch = userEmails.find(email => {
      const normalizedEmail = email.toLowerCase();
      return (normalizedEmail.includes(firstName) && normalizedEmail.includes(lastName));
    });
    
    if (exactFullNameMatch) {
      console.log(`Found full name exact match: ${exactFullNameMatch}`);
      return exactFullNameMatch;
    }
    
    // Try exact format match (first.last@domain.com)
    const formatExactMatch = userEmails.find(email => {
      const normalizedEmail = email.toLowerCase();
      return normalizedEmail.includes(`${firstName}.${lastName}`) || 
             normalizedEmail.includes(`${lastName}.${firstName}`);
    });
    
    if (formatExactMatch) {
      console.log(`Found exact email format match: ${formatExactMatch}`);
      return formatExactMatch;
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
  
  // Fallback to partial matching only if we haven't found a match yet
  // This is less precise so we do it last
  const userName = normalizedName.replace(/\s+/g, '.');
  const userNameNoSpace = normalizedName.replace(/\s+/g, '');
  
  for (const email of userEmails) {
    const normalizedEmail = email.toLowerCase();
    
    if (normalizedEmail.includes(userName) || normalizedEmail.includes(userNameNoSpace)) {
      console.log(`Found partial email match: ${email}`);
      return email;
    }
  }
  
  // Last resort - check if any name part is in the email
  // But only if all name parts are found to reduce false matches
  if (nameParts.length >= 2) {
    for (const email of userEmails) {
      const normalizedEmail = email.toLowerCase();
      
      // Check if ALL name parts are in the email
      const allPartsFound = nameParts.every(part => 
        part.length > 2 && normalizedEmail.includes(part)
      );
      
      if (allPartsFound) {
        console.log(`Found all name parts in email: ${email}`);
        return email;
      }
    }
  }
  
  console.log(`No email match found for ${memberName}`);
  return undefined;
};
