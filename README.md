implementation https://github.com/criperrr/pf-API with a database caching system and auto internal update

the auto refresh hopefuly one day will be based on heuristic statistics

create an account in
```http
POST /api/v1/nsac/accounts
```
```json
{
    "email": "yourNSacemail@unesp.br",
    "password": "yoursecret"
}
```
it will return an api token. this token replaces your password, so be careful
**the api save all scrapping data and authentication methods on a postgresql database

then get your grades using:
```http
GET /api/v1/nsac/grades
```
and it will return a data structure that contains all of your grades and other useful data

run it with:
```sh
npm run dev
```

set up the following .env:
```env
ENCRYPTIONKEY="create a encryption key with 32 bytes"
DB_HOST="default localhost"
DB_PORT="default 5432" 
DB_NAME="default postgres"
DB_USER="default postgres"
DB_PASSWORD="default is an empty string"
```