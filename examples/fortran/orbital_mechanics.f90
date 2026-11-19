! GHOSTCODE Fortran Demonstration: Orbital Mechanics & Numerical Integration
program orbital_mechanics_demo
    implicit none
    integer, parameter :: dp = selected_real_kind(15, 307)
    real(dp), parameter :: GM = 3.986004418e14_dp
    real(dp), parameter :: R_EARTH = 6378137.0_dp
    real(dp) :: r(3), v(3), dt, t, t_max
    real(dp) :: r_mag, a(3)
    integer :: step

    r = [R_EARTH + 400000.0_dp, 0.0_dp, 0.0_dp]
    v = [0.0_dp, 7670.0_dp, 0.0_dp]
    dt = 10.0_dp
    t_max = 5400.0_dp
    t = 0.0_dp

    print *, "=== GHOSTCODE ORBITAL INTEGRATION DEMO ==="
    print *, "Initial Altitude (km):", (sqrt(sum(r**2)) - R_EARTH) / 1000.0_dp
    print *, "Initial Velocity (m/s):", sqrt(sum(v**2))

    do while (t < t_max)
        r_mag = sqrt(sum(r**2))
        a = -GM * r / (r_mag**3)
        v = v + a * dt
        r = r + v * dt
        t = t + dt
    end do

    print *, "Final Altitude (km):  ", (sqrt(sum(r**2)) - R_EARTH) / 1000.0_dp
    print *, "Final Velocity (m/s): ", sqrt(sum(v**2))
    print *, "=== SIMULATION COMPLETED ==="
end program orbital_mechanics_demo
