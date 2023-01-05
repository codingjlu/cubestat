// copyright (c) codingjlu 2023
// https://github.com/codingjlu/cubestat

customElements.define("cube-stat", class extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: "closed" })
    shadow.innerHTML = `
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
        }
        :host {
          --dark: rgb(48, 48, 48);
          --light: rgb(255, 253, 242);
          --primary: rgb(252, 186, 3);
          --secondary: rgb(255, 246, 217);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: absolute;
          background-color: var(--dark);
          color: var(--light);
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: flex;
          overflow: hidden;
        }
        @media (max-width: 800px) {
          :host {
            flex-direction: column;
          }
          :host > div {
            height: 100%;
          }
        }
        ::selection {
          background: rgb(240, 141, 192, 0.4);
        }
        h1, h2, h3 {
          color: var(--primary);
          margin-bottom: 0;
        }
        :host > div {
          text-align: center;
          width: 100%;
        }
        :host > div:first-of-type {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        :host > div:last-of-type {
          background-color: rgba(255, 255, 255, 0.05);
        }
        :host > div:last-of-type > div {
          height: 100%;
          width: 100%;
          padding: 100px 50px;
        }
        stat-timer, stat-output {
          display: block;
        }
      </style>
      <div>
        <div>
          <h1>CubeStat</h1>
          <stat-timer></stat-timer>
        </div>
      </div>
      <div>
        <div>
          <stat-output></stat-output>
        </div>
      </div>
      <stat-scramble></stat-scramble>
    `
  }
})

customElements.define("stat-timer", class extends HTMLElement {
  #on = false

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.innerHTML = `
      <style>
        ::selection {
          background: rgb(240, 141, 192, 0.4);
        }
        span {
          font-size: clamp(7rem, 9rem, 12rem);
          transition: 100ms opacity;
        }
        span.active {
          opacity: 0.8;
        }
        button {
          text-transform: uppercase;
          font-family: inherit;
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          outline: none;
          color: var(--color-dark);
          border-radius: 10px;
          font-size: 1.3rem;
          padding: 6px 45px;
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: background-color 150ms;
        }
        @media (max-width: 800px) {
          button {
            font-size: 1.5rem;
          }
        }
        button::after {
          content: 'or press [space]';
          text-transform: lowercase;
          position: absolute;
          font-size: 1rem;
          opacity: 0.6;
          top: 110%;
          width: 150px;
          left: 50%;
          transform: translate(-50%);
          pointer-events: none;
        }
        button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        button:active, button.active {
          background-color: rgba(255, 255, 255, 0.3);
        }
      </style>
      <span>0.00</span>
      <br />
      <button>Start</button>
    `
  }
  get on() {
    return this.#on
  }
  set on(is) {
    this.#on = is
    this.btn.innerText = is ? "stop" : "start"

    if (is) {
      this.timer()
    } else {
      this.controller.abort()
      const display = new CustomEvent("stat-update", { detail: +this.time.innerText })
      window.dispatchEvent(display)
      window.dispatchEvent(new Event("stat-scramble"))
    }
  }
  connectedCallback() {
    this.time = this.shadow.querySelector("span")
    this.btn = this.shadow.querySelector("button")

    window.addEventListener("keypress", e => {
      if (e.key !== " ")
        return
      this.btn.classList.add("active")
      this.time.classList.add("active")
    })
    window.addEventListener("keyup", e => {
      if (e.key === " ") {
        this.btn.classList.remove("active")
        this.time.classList.remove("active")
        this.on = !this.on
      }
    })

    this.btn.addEventListener("mousedown", e => e.preventDefault())
    this.btn.addEventListener("click", () => {
      this.on = !this.on
    })
  }
  timer() {
    this.time.innerText = "0.00"
    const start = Date.now()
    this.controller = new AbortController()

    const update = () => {
      if (this.controller.signal.aborted) return
      const time = ((Date.now() - start) / 1000).toFixed(2)
      this.time.innerText = time
      window.requestAnimationFrame(update)
    }
    window.requestAnimationFrame(update)
  }
})

customElements.define("stat-output", class extends HTMLElement {
  constructor() {
    super()
    this.list = []
    this.render([])
  }
  connectedCallback() {
    window.addEventListener("stat-update", ({ detail }) => {
      this.list.push(detail)
      this.render(this.list)
    })
  }
  render(data) {
    const [UP, DOWN] = ["↗", "↘"]
    this.innerHTML = `
      <style>
        #attempts {
          margin-top: 50px;
        }
        @media (max-width: 800px) {
          #attempts {
            display: none;
          }
        }
        h2 {
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        ::-webkit-scrollbar {
          display: none;
        }
        #attempts div {
          max-height: 70vh;
          overflow: auto;
        }
        #attempts div div {
          width: 100%;
          background-color: var(--dark);
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 1.2rem;
          padding: 10px 20px;
          margin-top: 10px;
        }
        #attempts div div span:first-of-type {
          font-weight: bold;
        }
        #attempts div div span:last-of-type {}
      </style>
      <stat-group data=${JSON.stringify(data)}></stat-group>
      <div id="attempts">
        <h2>Attempts</h2>
        <div>
          ${data.map((u, i) => `
            <div>
              <span>
                <span style="font-weight: 800;">${data[i] > data[i - 1] ? UP : DOWN}</span>
                ${u.toFixed(2)}
              </span>
              <span>Attempt ${i + 1}</span>
            </div>
          `).reverse().join("")}
        </div>
      </div>
    `
  }
})

customElements.define("stat-group", class extends HTMLElement {
  connectedCallback() {
    const process = JSON.parse(this.getAttribute("data"))
    const showAttempts = this.hasAttribute("showAttempts")

    process.sort((a, b) => a - b)
    const best = process[0]
    const average = process.reduce((a, b) => a + b, 0) / process.length
    const worst = process.at(-1)

    const shadow = this.attachShadow({ mode: "open" })
    shadow.innerHTML = `
      <style>
        ::selection {
          background: rgb(240, 141, 192, 0.4);
        }

        #summary {
          width: 100%;
          display: flex;
          gap: 15px;
        }
        #attempts, hr {
          display: none;
        }
        hr {
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          margin: 15px 0;
        }
        @media (max-width: 800px) {
          #summary {
            flex-direction: column;
          }
          #attempts, hr {
            display: initial;
          }
        }
        #summary span {
          background-color: var(--dark);
          width: 100%;
          border-radius: 10px;
          padding: 10px;
          font-size: 1.3rem;
          position: relative;
        }
        #summary span::before {
          content: attr(id);
          text-transform: uppercase;
          position: absolute;
          font-size: 1rem;
          bottom: calc(100% - 12px);
          left: 15px;
          font-weight: bold;
        }
        #best::before {
          color: var(--primary);
        }
      </style>
      <div id="summary">
        <span id="best">${best?.toFixed?.(2) || "--"}</span>
        <span id="average">${isNaN(average) ? "--" : average.toFixed(2)}</span>
        <span id="worst">${worst?.toFixed?.(2) || "--"}</span>
        <hr />
        <span id="attempts">${process.length || "--"}</span>
      </div>
    `
  }
})

customElements.define("stat-scramble", class extends HTMLElement {
  connectedCallback() {
    this.render()
    
    window.addEventListener("stat-scramble", () => this.render())
    this.addEventListener("click", () => this.render())
    this.addEventListener("mousedown", e => {
      var offsetX = e.clientX - parseInt(window.getComputedStyle(this).left)
      var offsetY = e.clientY - parseInt(window.getComputedStyle(this).top)
      
      const mouseMoveHandler = e => {
        this.style.top = (e.clientY - offsetY) + "px"
        this.style.left = (e.clientX - offsetX) + "px"
      }
  
      const reset = () => {
        window.removeEventListener("mousemove", mouseMoveHandler)
        window.removeEventListener("mouseup", reset)
      }
  
      window.addEventListener("mousemove", mouseMoveHandler)
      window.addEventListener("mouseup", reset)
    })
  }
  render() {
    this.innerHTML = `
      <style>
        stat-scramble {
          position: fixed;
          left: 50%;
          bottom: 50px;
          transform: translateX(-50%);
          background-color: rgb(40, 40, 40);
          box-shadow: 4px 2px 4px 1px rgba(0, 0, 0, 0.3);
          padding: 10px 15px;
          border-radius: 10px;
          font-size: 1.3rem;
          font-family: 'Courier New', monospace;
          cursor: pointer;
          user-select: none;
          height: fit-content;
          width: fit-content;
        }
        @media (max-width: 800px) {
          stat-scramble {
            display: none;
          }
        }
      </style>
      ${this.scramble().join(" ")}
    `
    this.style.width = "fit-content"
    this.style.width = this.getBoundingClientRect().width + "px"
  }
  scramble() {
    const rand = (max, min = 0) => (Math.random() * (max - min) + min) | 0
    const moves = [["F", "R", "U", "B", "L", "D"]]
    moves.push(moves[0].map(i => i + "'"))
    moves.push(moves[0].map(i => i + "2"))

    const outputLength = 25

    const result = Array(outputLength).fill()
    for (let i = 0; i < result.length; i++) {
      const choice = Math.random()
      const type = choice > .5 ? 0 : choice > .2 ? 1 : 2
      let move
      if (i) {
        const prev = result[i - 1]
        const pos = moves[0].findIndex(j => j.startsWith(prev[0]))
        const choose = moves[type].slice(0, pos).concat(moves[type].slice(pos + 1))
        move = choose[rand(choose.length)]
      } else {
        move = moves[type][rand(moves[0].length)]
      }
      result[i] = move
    }

    return result
  }
})

/*
To everyone who read this far: congrats and I hope you don't laugh at my ugly code

please don't read this: Vm0wd2QyUXlVWGxXYTFwUFZsZFNXRll3Wkc5V1ZsbDNXa2M1VjAxV2JETlhhMk0xVmpGS2MySkVUbGhoTVVwVVZtcEtTMUl5U2tWVWJHaG9UVlZ3VlZadGNFZFR.NbEpJVm10c2FWSnRhRzlVVjNOM1pVWmtWMWt6YUZSTlZXdzBWMnRvVjJGR1NuUlZiRkpoVmpOU1IxcFZXbUZrUjFKSFYyMTRVMkpIZHpCV2Fra3hVakZhV0ZOcmFGWmlhMHBYV1d4b1UwMHhWWGhYYlVacVlrZDBObGxWV2xOVWJGcFZWbXR3VjJKVVJYZFpla3BIWXpGT2RWVnRhRk5sYlhoWFZtMHdlR0l4U2tkalJtUllZbGhTV0ZSV1dtRmxW.bkJHVjJ4T1ZXSkdjREZWVm1o.clZqSkZlVlZZWkZkaGExcFlXa1ZhVDJOdFJrZFhiV3hvVFVoQ1dWWXhaRFJpTVZWNFlrWmthbEp0YUhOVmFrSmhWMFpzY2xwR1RteFdiR3cxV2xWV1QxWXdNWEpXYWs1YVRVWndWRlpxUm1GV01rNUhWRzFHVTFKV2NFVldiR1EwVVRGYVZrMVZWazVTUkVFNQ==
*/
