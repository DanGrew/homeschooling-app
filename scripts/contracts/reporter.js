'use strict';

function report(results) {
  let totalErrors = 0;

  for (const { file, errors } of results) {
    if (errors.length === 0) {
      console.log(`  \u2705 ${file}`);
    } else {
      console.log(`\n  \u274c ${file}`);
      for (const e of errors) console.log(`     \u2192 ${e}`);
      totalErrors += errors.length;
    }
  }

  console.log('');
  if (totalErrors === 0) {
    console.log('\u2705 All pages pass contract checks.');
  } else {
    console.log(`\u274c ${totalErrors} violation(s) across ${results.filter(r => r.errors.length).length} page(s).`);
  }

  return totalErrors;
}

module.exports = { report };
