! Precision and machine constants definition module
module precision_constants
    use, intrinsic :: iso_fortran_env, only: real64
    implicit none
    private
    public :: dp, EPSILON_DP, TOL_STABILITY, MAX_CONDITION_NUM, PI_DP
    integer, parameter :: dp = real64
    real(dp), parameter :: EPSILON_DP = epsilon(1.0_dp)
    real(dp), parameter :: TOL_STABILITY = 1.0e-12_dp
    real(dp), parameter :: MAX_CONDITION_NUM = 1.0e14_dp
    real(dp), parameter :: PI_DP = 3.141592653589793238462643383279502884197_dp
end module precision_constants
