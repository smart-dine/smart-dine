const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatMoney = (valueInMinorUnits: number) => currencyFormatter.format(valueInMinorUnits / 100);

export const formatDateTime = (isoDateString: string) => dateTimeFormatter.format(new Date(isoDateString));
