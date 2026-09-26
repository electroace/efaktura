export type PriceItem = { quantity:number; price:number; vat:number; discount?:number };

export function lineAmounts(item: PriceItem) {
  const gross = Math.round(item.quantity * item.price * 100);
  const discount = Math.round(gross * (item.discount ?? 0) / 100);
  const net = gross - discount;
  return {gross, discount, net, vat:Math.round(net * item.vat / 100)};
}

export function documentTotals(items: PriceItem[]) {
  return items.reduce((sum,item) => {
    const line=lineAmounts(item);
    return {gross:sum.gross+line.gross,discount:sum.discount+line.discount,
      net:sum.net+line.net,vat:sum.vat+line.vat};
  },{gross:0,discount:0,net:0,vat:0});
}
