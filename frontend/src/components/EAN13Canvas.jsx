import { useRef, useEffect } from 'react'

const A = [
  '0001101','0011001','0010011','0111101','0100011',
  '0110001','0101111','0111011','0110111','0001011'
]
const B = [
  '0100111','0110011','0011011','0100001','0011101',
  '0111001','0000101','0010001','0001001','0010111'
]
const C = [
  '1110010','1100110','1101100','1000010','1011100',
  '1001110','1010000','1000100','1001000','1110100'
]
const PARITY = [
  'AAAAAA','AABABB','AABBAB','AABBBA','ABAABB',
  'ABBAAB','ABBBAA','ABABAB','ABABBA','ABBABA'
]

export default function EAN13Canvas({ code, width = 200, height = 100 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !code || code.length !== 13) return
    const ctx = canvas.getContext('2d')
    const dpr = 2
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    const digits = code.split('').map(Number)
    const first = digits[0]
    const left = digits.slice(1, 7)
    const right = digits.slice(7, 13)

    let pattern = ''
    pattern += '101'
    const parity = PARITY[first]
    left.forEach((d, i) => { pattern += parity[i] === 'A' ? A[d] : B[d] })
    pattern += '01010'
    right.forEach(d => { pattern += C[d] })
    pattern += '101'

    const margin = 10
    const drawW = width - margin * 2
    const moduleW = drawW / pattern.length

    const barH = height - 22
    ctx.fillStyle = '#000000'
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        const x = margin + i * moduleW
        const isGuard = i < 3 || (i >= pattern.length - 3) || (i >= 45 && i <= 49)
        const h = isGuard ? barH : barH
        ctx.fillRect(Math.round(x), 0, Math.ceil(moduleW), h)
      }
    }

    ctx.fillStyle = '#000000'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'

    const textY = barH + 16
    ctx.fillText(code[0], margin - 5, textY)
    const leftW = (drawW - 10) / 2
    const rightW = (drawW - 10) / 2
    ctx.fillText(code.slice(1, 7), margin + leftW / 2 + 5, textY)
    ctx.fillText(code.slice(7), margin + leftW + rightW / 2 + 5, textY)
  }, [code, width, height])

  return <canvas ref={ref} style={{ width, height }} />
}