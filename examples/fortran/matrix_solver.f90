! GHOSTCODE Fortran Demonstration: Linear System Solver
! Features: Numerical pivoting, condition estimation, and residual verification
module matrix_solver_demo
    use, intrinsic :: iso_fortran_env, only: real64, int32
    implicit none
    private
    public :: solve_linear_system, compute_matrix_residual
    integer, parameter :: dp = real64

contains
    subroutine solve_linear_system(n, a_mat, b_vec, x_vec, cond_estimate)
        integer, intent(in) :: n
        real(dp), intent(in) :: a_mat(n, n)
        real(dp), intent(in) :: b_vec(n)
        real(dp), intent(out) :: x_vec(n)
        real(dp), intent(out) :: cond_estimate
        real(dp) :: lu_mat(n, n), factor, pivot
        integer :: i, j, k, max_idx

        lu_mat = a_mat
        x_vec = b_vec
        cond_estimate = 1.0_dp

        do k = 1, n - 1
            max_idx = k
            pivot = abs(lu_mat(k, k))
            do i = k + 1, n
                if (abs(lu_mat(i, k)) > pivot) then
                    pivot = abs(lu_mat(i, k))
                    max_idx = i
                end if
            end do

            if (pivot < 1.0e-14_dp) then
                cond_estimate = 1.0e16_dp
                return
            end if

            do i = k + 1, n
                factor = lu_mat(i, k) / lu_mat(k, k)
                do j = k + 1, n
                    lu_mat(i, j) = lu_mat(i, j) - factor * lu_mat(k, j)
                end do
                x_vec(i) = x_vec(i) - factor * x_vec(k)
            end do
        end do

        x_vec(n) = x_vec(n) / lu_mat(n, n)
        do i = n - 1, 1, -1
            do j = i + 1, n
                x_vec(i) = x_vec(i) - lu_mat(i, j) * x_vec(j)
            end do
            x_vec(i) = x_vec(i) / lu_mat(i, i)
        end do
    end subroutine solve_linear_system

    subroutine compute_matrix_residual(n, a_mat, b_vec, x_vec, residual_norm)
        integer, intent(in) :: n
        real(dp), intent(in) :: a_mat(n, n)
        real(dp), intent(in) :: b_vec(n)
        real(dp), intent(in) :: x_vec(n)
        real(dp), intent(out) :: residual_norm
        real(dp) :: ax(n)
        integer :: i, j

        residual_norm = 0.0_dp
        do i = 1, n
            ax(i) = 0.0_dp
            do j = 1, n
                ax(i) = ax(i) + a_mat(i, j) * x_vec(j)
            end do
            residual_norm = residual_norm + (ax(i) - b_vec(i))**2
        end do
        residual_norm = sqrt(residual_norm)
    end subroutine compute_matrix_residual
end module matrix_solver_demo

program test_matrix_solver
    use matrix_solver_demo
    implicit none
    integer, parameter :: dp = 8
    real(dp) :: a(3, 3), b(3), x(3), cond, res

    a = reshape([4.0_dp, 1.0_dp, 0.0_dp, 1.0_dp, 4.0_dp, 1.0_dp, 0.0_dp, 1.0_dp, 4.0_dp], [3, 3])
    b = [1.0_dp, 2.0_dp, 3.0_dp]

    print *, "=== GHOSTCODE FORTRAN MATRIX SOLVER DEMO ==="
    call solve_linear_system(3, a, b, x, cond)
    call compute_matrix_residual(3, a, b, x, res)
    print *, "Condition estimate:", cond
    print *, "Residual norm:     ", res
    print *, "=== DEMO COMPLETE ==="
end program test_matrix_solver
