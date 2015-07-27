import fetch from 'node-fetch'

async () => {
  let response = await fetch('http://localhost:14444/login', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'username5',
      password: 'password2'
    })
  })
  let json = await response.json()
  console.log(json)
}().catch(console.log)
