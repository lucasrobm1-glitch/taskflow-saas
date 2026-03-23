const http = require('http')

function req(path, body) {
  return new Promise((resolve) => {
    const d = JSON.stringify(body)
    const o = { hostname: 'localhost', port: 5000, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }
    const r = http.request(o, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(b)) })
    r.write(d); r.end()
  })
}

async function main() {
  console.log('--- Testando login com teste@gmail.com ---')
  const login = await req('/api/auth/login', { email: 'teste@gmail.com', password: '12345678' })
  console.log('Login:', login)

  console.log('\n--- Registrando novo usuario ---')
  const reg = await req('/api/auth/register', { name: 'lucas', email: 'lucas@test.com', password: '123456', companyName: 'MinhaEmpresa' })
  console.log('Register:', reg)

  console.log('\n--- Login com novo usuario ---')
  const login2 = await req('/api/auth/login', { email: 'lucas@test.com', password: '123456' })
  console.log('Login2:', login2)
}

main()
