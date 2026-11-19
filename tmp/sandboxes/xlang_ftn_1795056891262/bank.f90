
program xlang_bank
    implicit none
    integer, parameter :: dp = selected_real_kind(15, 307)
    real(dp) :: principal, rate_annual, rate_monthly, factor, payment
    integer :: months, i

    principal = 250000.00_dp
    rate_annual = 5.2500_dp
    months = 360

    rate_monthly = (rate_annual / 100.0_dp) / 12.0_dp
    factor = (1.0_dp + rate_monthly) ** months
    payment = principal * (rate_monthly * factor) / (factor - 1.0_dp)

    write(*, '(F12.2)') payment
end program xlang_bank
    