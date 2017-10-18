// Inform the background page that
// this tab should have a page-action
chrome.runtime.sendMessage({
  from:    'content',
  subject: 'showPageAction'
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  // First, validate the message's structure
  if ((msg.from === 'popup') && (msg.subject === 'DOMInfo')) {

    var reCost = new RegExp("([0-9]+\\.[0-9]+)", "g");
    var reName = new RegExp("(.+?)(?=paid)", "g");
    var expenses = [];
    var expenseMatch, expenseCost, expenseDate, expenseName, expenseMatch, you, youSpan, youOwe, flag;

    var dropdowns = document.getElementsByClassName('dropdown-toggle');
    for (var i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].className == 'dropdown-toggle'){
            var yourName = dropdowns[i].childNodes[2].textContent.trim();
            break;
        }
    }

    var balances = document.getElementsByClassName('personal_balance');
    var currentBalance = {};
    for (var i = 0; i < balances.length; i++) {
        name = balances[i].childNodes[3].innerText;
        balance = balances[i].childNodes[5];
        if (balance.className == 'balance owes_me'){
            currentBalance[name] = +balance.innerText.match(reCost);
        } else if (balance.className == 'balance i_owe') {
            currentBalance[name] = -balance.innerText.match(reCost);
        } else if (balance.className == 'balance settled_up') {
            currentBalance[name] = 0;
        }
    }

    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1;
    var year = date.getFullYear();

    var hour = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    var cumulativeOwe = currentBalance[yourName];

    var now = year + "-" + month + "-" + day + "T" + hour + ":" + minutes + ":" + seconds + "Z";
    var expense = {cost: null,
                   date: now,
                   name: null,
                   owe: null,
                   cumulativeOwe: cumulativeOwe,
                   index: -1};

    expenses = expenses.concat(expense);

    expenseEntries = document.getElementsByClassName('expense');
    for (var i = 0; i < expenseEntries.length; i++) {
        if (expenseEntries[i].className == 'expense') {

            expenseDate = expenseEntries[i].getAttribute("data-date");
            you = expenseEntries[i].firstChild.childNodes[1].childNodes[3].childNodes;
            flag = 0;
            for (var j = 0; j < you.length; j++){
                if (you[j].nodeName == 'SPAN'){
                    youSpan = you[j];
                    if (youSpan.getAttribute("class") == "negative"){
                        youOwe = -youSpan.innerText.match(reCost);
                        cumulativeOwe += +youSpan.innerText.match(reCost);
                    } else {
                        youOwe = +youSpan.innerText.match(reCost);
                        cumulativeOwe += -youSpan.innerText.match(reCost)
                    }
                    flag = 1;
                    break;
                }
            }
            if (!flag){
                youOwe = 0;
            }

            expenseMatch = expenseEntries[i].firstChild.childNodes[1].childNodes[2].innerText.match(reCost);
            if (expenseMatch == null) {
                // Is a direct payment
                expenseCost = youOwe;
            } else {
                expenseCost = expenseMatch[0];
            }
            expenseName = expenseEntries[i].firstChild.childNodes[1].childNodes[2].innerText.match(reName)[0];

            expense = {cost: expenseCost,
                       date: expenseDate,
                       name: expenseName,
                       owe: youOwe,
                       cumulativeOwe: cumulativeOwe,
                       index: i};

            expenses = expenses.concat(expense);
        }
    }
    response(expenses);
  }
});
