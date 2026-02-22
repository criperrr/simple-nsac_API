Recreating https://github.com/criperrr/pf-API but just for scrapping, zero authentication or nosense

Basically you can make a GET request to /api/nsac/grades and get your grades putting your NSac email and password in body like this:
```http
GET /api/nsac/grades
```
```json
{
    "email": "yourNSacemail@unesp.br",
    "password": "yoursecret"
}
```
also it creates a simples sqlite database in local to storage users data, crypted, obviously, just to not spam requests to NSac.

run it with:
```sh
npm run dev
```

set up the following .env:
```env
ENCRYPTIONKEY="create a encryption key with 32 bytes"
SECRETKEY="random string"
```