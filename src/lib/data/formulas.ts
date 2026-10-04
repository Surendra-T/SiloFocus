/** Built-in formula sheets (KaTeX-compatible markdown) for the default subjects. */
export const STATIC_FORMULAS: Record<string, string> = {
  Physics: String.raw`## Mechanics
**Equations of motion**
$$v = u + at \qquad s = ut + \tfrac{1}{2}at^2 \qquad v^2 = u^2 + 2as$$
**Work–energy theorem**
$$W = \Delta K = \tfrac{1}{2}mv^2 - \tfrac{1}{2}mu^2$$

## Electrostatics
**Coulomb's law**
$$F = \frac{1}{4\pi\varepsilon_0}\frac{q_1 q_2}{r^2}$$
**Electric field of a point charge**
$$E = \frac{1}{4\pi\varepsilon_0}\frac{q}{r^2}$$
**Capacitance of a parallel plate capacitor**
$$C = \frac{\varepsilon_0 A}{d}$$

## Current electricity
**Ohm's law and resistivity**
$$V = IR \qquad R = \rho \frac{l}{A}$$

## Optics
**Lens maker's formula**
$$\frac{1}{f} = (n-1)\left(\frac{1}{R_1} - \frac{1}{R_2}\right)$$
**Thin lens equation**
$$\frac{1}{v} - \frac{1}{u} = \frac{1}{f}$$

## Electromagnetic induction
**Faraday's law**
$$\varepsilon = -\frac{d\Phi_B}{dt}$$`,

  Chemistry: String.raw`## Physical chemistry
**Ideal gas equation**
$$PV = nRT$$
**Molarity and molality**
$$M = \frac{n_{\text{solute}}}{V_{\text{solution (L)}}} \qquad m = \frac{n_{\text{solute}}}{m_{\text{solvent (kg)}}}$$
**Nernst equation (298 K)**
$$E_{\text{cell}} = E^\circ_{\text{cell}} - \frac{0.0591}{n}\log Q$$

## Kinetics
**First-order rate law**
$$k = \frac{2.303}{t}\log\frac{[A]_0}{[A]} \qquad t_{1/2} = \frac{0.693}{k}$$
**Arrhenius equation**
$$k = A e^{-E_a/RT}$$

## Thermodynamics
**Gibbs free energy**
$$\Delta G = \Delta H - T\Delta S \qquad \Delta G^\circ = -RT\ln K$$

## Solutions
**Raoult's law and colligative property**
$$p_A = x_A p_A^\circ \qquad \Delta T_f = K_f \, m$$`,

  Mathematics: String.raw`## Differentiation
**Standard derivatives**
$$\frac{d}{dx}x^n = nx^{n-1} \qquad \frac{d}{dx}\sin x = \cos x \qquad \frac{d}{dx}e^x = e^x \qquad \frac{d}{dx}\ln x = \frac{1}{x}$$
**Chain and product rules**
$$\frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx} \qquad (uv)' = u'v + uv'$$

## Integration
**Standard integrals**
$$\int x^n\,dx = \frac{x^{n+1}}{n+1} + C \quad (n\neq -1) \qquad \int \frac{1}{x}\,dx = \ln|x| + C$$
**Integration by parts**
$$\int u\,dv = uv - \int v\,du$$
**Fundamental theorem of calculus**
$$\int_a^b f(x)\,dx = F(b) - F(a)$$

## Differential equations
**First-order linear form**
$$\frac{dy}{dx} + Py = Q \qquad \text{I.F.} = e^{\int P\,dx}$$

## Vectors and 3D geometry
$$\vec a\cdot\vec b = |\vec a||\vec b|\cos\theta \qquad |\vec a\times\vec b| = |\vec a||\vec b|\sin\theta$$`,
};
