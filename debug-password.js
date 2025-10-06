const { validatePassword } = require('./src/lib/security');

console.log('Testing password: SecurePass123!');
console.log(validatePassword('SecurePass123!'));

console.log('Testing password: MyStr0ng!P@ssw0rd');
console.log(validatePassword('MyStr0ng!P@ssw0rd'));

console.log('Testing password: Complex123#Password');
console.log(validatePassword('Complex123#Password'));

console.log('Testing password: Another$tr0ngP@ssword');
console.log(validatePassword('Another$tr0ngP@ssword'));