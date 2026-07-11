const fs = require('fs');
const files = [
  'booking-already-exists',
  'cancelled-booking',
  'completed-booking',
  'inactive-service',
  'invalid-booking-date',
  'invalid-status-transition'
];

files.forEach(f => {
  const name = f.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Exception';
  let errorCode = f.toUpperCase().replace(/-/g, '_') + '_ERR';
  // If invalid-booking-date, we should use BAD_REQUEST instead of CONFLICT
  const status = (f === 'invalid-booking-date') ? 'BAD_REQUEST' : 'CONFLICT';
  let content = `import { HttpStatus } from '@nestjs/common';
import { BaseBusinessException } from './base-business.exception';

export class ${name} extends BaseBusinessException {
  constructor(message: string = '${name.replace('Exception', ' error')}') {
    super(message, '${errorCode}', HttpStatus.${status});
  }
}
`;
  fs.writeFileSync('src/common/exceptions/' + f + '.exception.ts', content);
});
console.log('Done');
