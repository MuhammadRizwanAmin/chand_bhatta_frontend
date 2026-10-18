export const getCurrency = () => {
  if (typeof window !== 'undefined') {
    const currency = localStorage.getItem('currency');
    if (currency) {
      // currency might be saved as 'PKR – Pakistani Rupee', so we split it or just return 'PKR'
      return currency.split(' ')[0] || 'PKR';
    }
  }
  return 'PKR';
};
