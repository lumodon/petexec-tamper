(function() {
  'use strict';
  const DEBUG_MODE = false;

  // TODO: Update to fetch from table header
  const SEARCH_PHOTO_COL = 6;
  const BOARDING_PHOTO_COL = 9;

  const outerContainer = document.querySelector('body > nav')?.nextElementSibling;
  const mainContentDiv = outerContainer.querySelector('.sub-page');
  const runOnPetSearch = () => {
    const observer = new MutationObserver((mutationList, _observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          (async () => {
            for (const itNode of Array.from(mutation.addedNodes) ?? []) {
              if (itNode.nodeName === 'H1') {
                const found = await checkPetSearchRun(itNode);
                const boarding = await checkBoardingSearchRun(itNode);
                if (found || boarding) {
                  return;
                }
              }
            }
          })();
        }
      }
    });

    observer.observe(outerContainer, { attributes: false, childList: true, subtree: false });
    observer.observe(mainContentDiv, { attributes: false, childList: true, subtree: false });
  };

  const restyleButtons = eTable => {
    const eTBody = eTable?.querySelector('tbody');

    Array.from(document.querySelectorAll('.lumo-signin') ?? []).forEach(qbtn => {
      const rowId = qbtn.getAttribute('data-orig-order');
      const belongingRow = eTBody.querySelector(`[data-orig-order="${rowId}"`);
      qbtn.style.top = `${belongingRow.offsetTop+4}px`;
      qbtn.style.height = `${belongingRow.clientHeight-12}px`;
    });
  };

  const updateTablePics = (targetTable, columnNum) => {
    const eRows = Array.from(targetTable.querySelectorAll('tbody > tr') ?? []);
    eRows.forEach(eRowIt => {
      const photoElement = eRowIt.querySelector(`td:nth-of-type(${columnNum}) a`);
      if (!photoElement) return;
      const photoElementParent = photoElement.parentNode;
      const photoData = photoElement.dataset.content;
      if (!photoData?.length) return;
      photoElement.outerHTML = photoElement.dataset.content;
      const imgElement = photoElementParent.querySelector('img');
      imgElement.addEventListener('load', () => {
        restyleButtons(targetTable);
      });
    });
  };

  const checkBoardingSearchRun = (indicatingElement) => new Promise((resolve, _reject) => {
    const isBoardingSearch = indicatingElement?.innerText.includes('Schedule Boarding');
    if (!isBoardingSearch) {
      resolve(false);
      return;
    }

    const observer = new MutationObserver((mutationList, _observer) => {
      (() => {
        for (const mutation of mutationList) {
          if (mutation.type === "childList" && mutation.addedNodes.length) {
            for (const itNode of Array.from(mutation.addedNodes ?? [])) {
              const isSearchPortion = Array.from(itNode?.parentElement?.querySelectorAll?.('h2') ?? [])
                ?.filter(it => it.innerText === 'Search Results')?.length;
              if (isSearchPortion) {
                const mainTable = itNode.parentNode.querySelector('.table-responsive table.table.sortable');
                updateTablePics(mainTable, BOARDING_PHOTO_COL);
                return;
              }
            }
          }
        }
      })();
    });

    observer.observe(mainContentDiv, { attributes: false, childList: true, subtree: true });
  });

  const checkPetSearchRun = (indicatingElement) => new Promise((resolve, _reject) => {
    const isPetSearch = indicatingElement?.innerText.includes('Pet Search');
    if (!isPetSearch) {
      resolve(false);
      return;
    }

    resolve(true);

    const eTable = document.querySelector('#top_search_table');
    const eTBody = eTable?.querySelector('tbody');

    if (!eTBody) return;

    const eTableWrapper = document.querySelector('#top_search_table_wrapper');
    const eSortingClicks = Array.from(eTable.querySelectorAll('thead .sorting') ?? []);
    const ePlayArea = eSortingClicks[eSortingClicks.length - 1];

    updateTablePics(eTable, SEARCH_PHOTO_COL);

    ePlayArea.innerText = 'Quick Signin';
    if (!eTable || !eTableWrapper || !eTBody) {
      console.warn('top_search_table or derivatives not found. Aborting');
      return;
    }

    Array.from(eTBody.children ?? []).forEach((it, index) => {
      it.setAttribute('data-orig-order', String(index));
      const eText = it.querySelector('a span:nth-of-type(2)');
      if (DEBUG_MODE) {
        eText.innerText = `${index} ${eText.innerText}`;
      }
    });
    eSortingClicks.forEach(it => {
      it.addEventListener('click', () => {
        setTimeout(() => {
          restyleButtons(eTable);
        }, 100);
      });
    });

    const eRows = [
      ...(
        Array.from(eTable.querySelectorAll('tr[role="row"].odd') ?? [])
          ?.filter(it => it.querySelector('td')?.innerHTML?.length > 0) ?? []
      ),
      ...(
        Array.from(eTable.querySelectorAll('tr[role="row"].even') ?? [])
          ?.filter(it => it.querySelector('td')?.innerHTML?.length > 0) ?? []
      ),
    ];

    eRows.forEach(eRowIt => {
      const signInBtn = Array.from(
        eRowIt.querySelectorAll('.dropdown-menu a[role="menuitem"]') ?? []
      )
        ?.filter(it => it.innerText === 'Sign into Daycare')
        ?.[0];
      const schedBoardingBtn = Array.from(
        eRowIt.querySelectorAll('.dropdown-menu a[role="menuitem"]') ?? []
      )
        ?.filter(it => it.innerText === 'Schedule a Boarding')
        ?.[0];

      const rects = eRowIt.getBoundingClientRect();

      const newLnkSignin = signInBtn.cloneNode();
      const newLnkBoarding = schedBoardingBtn.cloneNode();
      const rowId = Number(eRowIt.getAttribute('data-orig-order'));
      const dogName = eRowIt.querySelector('td div a#dropdownMenu2')?.innerText?.trim?.()?.split(' ')?.[0]?.slice(0,16);
      const lastName = eRowIt.querySelector('td:nth-of-type(2) div')?.innerText?.trim?.()?.split(',')?.[0]?.slice?.(0,1);

      newLnkSignin.innerText = `${DEBUG_MODE ? `${rowId} ` : ''}${dogName} ${lastName}`;
      newLnkBoarding.innerText = 'Quick boarding';
      const newStyle = {
        position: 'absolute',
        left: `${ePlayArea.offsetLeft}px`,
        top: `${eRowIt.offsetTop+4}px`,
        width: `${ePlayArea.clientWidth - 9}px`,
        margin: '3px 6px',
        height: `${rects.height-12}px`,
        backgroundImage: `linear-gradient(to right bottom, #fdbfe2, #f9c2e5, #f5c4e7, #f1c7e9, #edc9eb, #ecceee, #ebd4f1, #ebd9f3, #eee3f7, #f2edfb, #f8f6fd, #ffffff)`,
        boxShadow: `2px 2px 8px 0px rgba(148,107,148,1)`,
        textAlign: 'center',
        color: '#537bd5',
        fontWeight: 'bolder',
        fontSize: '15px',
        textWrap: 'nowrap',
        borderRadius: '15px',
        padding: '5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      };
      const boardingStyle = {
        ...newStyle,
        backgroundColor: '#ccf',
      };
      Object.keys(newStyle).forEach(key => {
        newLnkSignin.style[key] = newStyle[key];
      });

      newLnkSignin.setAttribute('data-orig-order', String(rowId));
      newLnkSignin.classList.add('lumo-signin');
      newLnkSignin.addEventListener('click', () => {
        window.localStorage.setItem('quickLinkUsed', 'true');
      });

      eTableWrapper.appendChild(newLnkSignin);
    });
  });

  if (window.location.href.includes('https://secure.petexec.net/admin/receipt.php?orderId=')) {
    const isPaid = document.evaluate(`//h3[text()="Account Balance"]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      ?.singleNodeValue?.nextSibling?.data?.includes?.('this account is in balance');
    const parentSection = document.querySelector('#mainContentDiv.sub-page');
    const newInfoBlock = document.createElement('div');
    const newStyle = {
      margin: '15px auto',
      width: '140px',
      height: '140px',
      fontWeight: 'bolder',
      backgroundColor: isPaid ? '#afa' : '#f99',
      textAlign: 'center',
      fontSize: '32px',
      padding: '23px 5px',
      borderRadius: '15px',
    };
    newInfoBlock.innerText = isPaid ? 'Paid In Full' : 'NOT PAID!';
    Object.keys(newStyle).forEach(key => {
      newInfoBlock.style[key] = newStyle[key];
    });
    parentSection.insertBefore(newInfoBlock, parentSection.children[0]);
    return;
  }

  if (window.location.href.includes('https://secure.petexec.net/admin/daycareSignin2.php?uid=')) {
    const eActionBtn = document.querySelector('#theAction');

    const quickLinkUsed = window.localStorage.getItem('quickLinkUsed');
    if (quickLinkUsed === 'true') {
      window.localStorage.setItem('quickLinkUsed', 'false');
      eActionBtn.click();
    }
  }

  if (window.location.href.includes('https://secure.petexec.net/admin/boardingSchedule.php')) {
    checkBoardingSearchRun(mainContentDiv);
  }

  runOnPetSearch();
})();
