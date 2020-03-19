let data = [
  { name: 'field[]', value: 'field 1' },
  { name: 'field[1]', value: 'field 2' },
  { name: 'field[]', value: 'field 3' },
  { name: 'field[]', value: 'field 4' },
  { name: 'field[]', value: 'field 5' },
], data2 = []

let length = data.length
for (let i = 0; i < length; i++) {
  const regex = /\[(.*?)\]/g
  // let name = JSON.parse(data[i]['name'])
  let name = data[i]['name'].toString()
  let arr = name.matchAll(regex)
  console.log(arr)
}
