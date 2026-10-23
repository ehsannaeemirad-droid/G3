import { mountMcq } from './items/mcq.js';
import { mountText } from './items/text.js';
import { mountOrder } from './items/order.js';
import { mountIdent } from './items/ident.js';
import { mountDouble } from './items/double.js';
import { mountFix } from './items/fix.js';

export function mountItem(container, item, ctx) {
  switch (item.type) {
    case 'mcq':
    case 'detect':
      return mountMcq(container, item, ctx);
    case 'fill':
    case 'text':
      return mountText(container, item, ctx);
    case 'order':
      return mountOrder(container, item, ctx);
    case 'ident':
      return mountIdent(container, item, ctx);
    case 'double':
      return mountDouble(container, item, ctx);
    case 'fix':
      return mountFix(container, item, ctx);
    default:
      container.innerHTML = `<p class="muted">نوع ناشناخته: ${item.type}</p>`;
  }
}
