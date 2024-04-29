const isSearchPortion = Boolean(
  document.evaluate(
    `//h2[text()="Search Results"]`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  )?.singleNodeValue
);
if (!isSearchPortion) {
  console.log('Not boarding search specifically. Exiting');
  resolve(false);
  return;
}
