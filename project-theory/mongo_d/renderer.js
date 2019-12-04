const fs = require("fs-extra");
const path = require("path");

const CURRENCIES = ["BTC", "NEO", "XRP", "LTC", "ETC"];
const dbPath = path.join(__dirname, "db");
class UserRepo {
  static write(users) {
    const content = JSON.stringify(users);
    try {
      fs.writeFileSync(dbPath, content);
    } catch (error) {
      console.error(error);
    }
  }
  static read() {
    try {
      const content = fs.readFileSync(dbPath, "utf8");
      const users = JSON.parse(content);
      return users;
    } catch (error) {
      console.error(error);
    }
  }
}
let AUTH;
document.getElementById("login_form").addEventListener("submit", event => {
  event.preventDefault();
  const id = document.getElementById("login_id").value;
  const users = UserRepo.read();
  const user = users.find(user => user.id === id);
  if (user) {
    AUTH = user;
    document.getElementById("login").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    CURRENCIES.forEach(currency => {
      const list = users.filter(user =>
        user.accounts.some(account => account.startsWith(currency))
      );
      list.forEach(user => {
        const li = document.createElement("li");
        const account = user.accounts.find(account =>
          account.startsWith(currency)
        );
        const money = Number(account.split("|")[1]);
        li.innerText = user.name + " / " + money;
        document.getElementById("dashboard_" + currency).appendChild(li);
      });
    });
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.id === AUTH.id) continue;
      const option = document.createElement("option");
      option.text = user.name;
      option.value = user.id;
      document.getElementById("transaction_user").appendChild(option);
    }
  }
});
document
  .getElementById("transaction_form")
  .addEventListener("submit", event => {
    event.preventDefault();
    const users = UserRepo.read();
    const userFrom = AUTH;
    const idTo = document.getElementById("transaction_user").value;
    const currency = document.getElementById("transaction_currency").value;
    let amount = document.getElementById("transaction_amount").value;
    amount = Number(amount);
    const userTo = users.find(user => user.id === idTo);
    if (!userTo || !currency || !amount || isNaN(amount)) {
      // invalid form data
      return;
    }
    const accountFrom = userFrom.accounts.find(account =>
      account.startsWith(currency)
    );
    const accountTo = userTo.accounts.find(account =>
      account.startsWith(currency)
    );
    if (!accountFrom || !accountTo) {
      // no corresponding accounts
      return;
    }
    const moneyFrom = Number(accountFrom.split("|")[1]);
    const moneyTo = Number(accountTo.split("|")[1]);
    if (moneyFrom > amount) {
      userFrom.accounts = userFrom.accounts.map(account => {
        if (account.startsWith(currency)) {
          return currency + "|" + (moneyFrom - amount).toFixed(2);
        }
        return account;
      });
      userTo.accounts = userTo.accounts.map(account => {
        if (account.startsWith(currency)) {
          return currency + "|" + (moneyTo + amount).toFixed(2);
        }
        return account;
      });
      const updated = users.map(user => {
        if (user.id === userFrom.id) return userFrom;
        if (user.id === userTo.id) return userTo;
        return user;
      });
      UserRepo.write(updated);
    }
  });
