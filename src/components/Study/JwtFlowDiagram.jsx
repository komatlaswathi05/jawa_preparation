// A simple JWT authentication sequence diagram built with HTML and Tailwind CSS.
const LANES = ['Client (browser / mobile app)', 'Spring Security', 'Your REST API']

const STEPS = [
  { from: 0, to: 1, label: 'POST /api/auth/login', detail: '{ "username": "asha", "password": "••••" }' },
  { from: 1, to: 1, label: 'Verify credentials', detail: 'UserDetailsService loads the user, BCrypt checks the password' },
  { from: 1, to: 0, label: '200 OK — tokens issued', detail: 'accessToken (short-lived JWT) + refreshToken' },
  { from: 0, to: 1, label: 'GET /api/orders', detail: 'Authorization: Bearer <accessToken>' },
  { from: 1, to: 1, label: 'JWT filter validates token', detail: 'Check signature + expiry, then set the SecurityContext' },
  { from: 1, to: 2, label: 'Authenticated request forwarded', detail: 'Roles checked, e.g. @PreAuthorize("hasRole(\'USER\')")' },
  { from: 2, to: 0, label: '200 OK — response data', detail: 'No session stored on the server (stateless)' },
  { from: 0, to: 1, label: 'POST /api/auth/refresh', detail: 'Access token expired → send the refresh token' },
  { from: 1, to: 0, label: 'New access token', detail: 'The user stays logged in without re-entering a password' },
]

function StepNumber({ number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
      {number}
    </span>
  )
}

function Arrow({ step, number }) {
  const start = Math.min(step.from, step.to)
  const end = Math.max(step.from, step.to)
  const span = end - start + 1
  const pointsRight = step.to > step.from

  // Self step: a box on one lifeline.
  if (span === 1) {
    return (
      <div style={{ gridColumn: `${start + 1} / ${start + 2}` }} className="flex justify-center px-2 py-2">
        <div className="relative z-10 max-w-56 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <StepNumber number={number} />
            <span className="text-sm font-medium text-indigo-900">{step.label}</span>
          </div>
          <p className="mt-1 text-xs text-indigo-700">{step.detail}</p>
        </div>
      </div>
    )
  }

  // Arrow from the centre of one lane to the centre of another.
  const inset = `${50 / span}%`
  return (
    <div style={{ gridColumn: `${start + 1} / ${end + 2}` }} className="py-2">
      <div style={{ marginLeft: inset, marginRight: inset }} className="relative z-10">
        <div className="flex items-center justify-center gap-2 px-2">
          <StepNumber number={number} />
          <span className="text-sm font-medium text-slate-900">{step.label}</span>
        </div>
        <p className="mt-0.5 px-2 text-center font-mono text-xs text-slate-500">{step.detail}</p>
        <div className="relative mt-1.5 h-0.5 bg-slate-400">
          <span
            className={`absolute top-1/2 size-0 -translate-y-1/2 border-y-[6px] border-y-transparent ${
              pointsRight ? '-right-1 border-l-[9px] border-l-slate-400' : '-left-1 border-r-[9px] border-r-slate-400'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

function JwtFlowDiagram() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="font-semibold text-slate-900">JWT authentication flow</h3>
      <p className="mt-1 text-sm text-slate-500">
        How a login turns into a token, and how that token is checked on every request.
      </p>

      {/* Wide screens: sequence diagram with three lanes */}
      <div className="relative mt-6 hidden sm:block">
        <div className="grid grid-cols-3 gap-0">
          {LANES.map((lane) => (
            <div key={lane} className="px-2 text-center">
              <div className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">{lane}</div>
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-3">
          {/* Dashed lifelines */}
          {[1, 3, 5].map((sixth) => (
            <div
              key={sixth}
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-200"
              style={{ left: `${(sixth / 6) * 100}%` }}
              aria-hidden="true"
            />
          ))}
          {STEPS.map((step, index) => (
            <Arrow key={step.label} step={step} number={index + 1} />
          ))}
        </div>
      </div>

      {/* Small screens: numbered list */}
      <ol className="mt-5 space-y-3 sm:hidden">
        {STEPS.map((step, index) => (
          <li key={step.label} className="flex gap-3">
            <StepNumber number={index + 1} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-indigo-600">
                {LANES[step.from].split(' (')[0]}
                {step.from !== step.to && ` → ${LANES[step.to].split(' (')[0]}`}
              </p>
              <p className="text-sm font-medium text-slate-900">{step.label}</p>
              <p className="font-mono text-xs break-words text-slate-500">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default JwtFlowDiagram
