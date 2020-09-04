export default ({ rentOrOwn, morgage, homeownersInsurance, propertyTax, rentAmount }) => {
   let validataion = { isValid: true, messages: [] };

   if(!rentOrOwn) return validataion;
   if(rentOrOwn === 'own') {
      validataion.isValid = !hasNumericValue(morgage?.incomeAmount, homeownersInsurance, propertyTax) && !!morgage?.endDate;
      validataion.messages.push('All morgage info must be filled out including morgage end date');
   } else if(rentOrOwn === 'rent') {
      validataion.isValid = !hasNumericValue(rentAmount);
      validataion.messages.push('All inputs must be filled out');
   }

   return validataion;
}

const hasNumericValue = (...answers) => answers.every(ans => ans !== undefined && ans !== '' && ans >= 0);
