! Subsystem: fast_fourier_subsystem
module fast_fourier_subsystem
    use, intrinsic :: iso_fortran_env, only: real64, int32
    implicit none
    private
    public :: run_subsystem_benchmark, evaluate_numerical_kernel
    integer, parameter :: dp = real64
    public :: compute_kernel_01
    public :: compute_kernel_02
    public :: compute_kernel_03
    public :: compute_kernel_04
    public :: compute_kernel_05
    public :: compute_kernel_06
    public :: compute_kernel_07
    public :: compute_kernel_08
    public :: compute_kernel_09
    public :: compute_kernel_10
    public :: compute_kernel_11
    public :: compute_kernel_12
    public :: compute_kernel_13
    public :: compute_kernel_14
    public :: compute_kernel_15
    public :: compute_kernel_16
    public :: compute_kernel_17
    public :: compute_kernel_18
    public :: compute_kernel_19
    public :: compute_kernel_20
    public :: compute_kernel_21
    public :: compute_kernel_22
! Domain: Radix-2 FFT & Spectral Density Engine
    public :: compute_kernel_23
    public :: compute_kernel_24
    public :: compute_kernel_25
contains
    subroutine compute_kernel_01(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
! Numerical Stability Standard: IEEE 754 Floating-Point Invariants
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_01
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 01)
    subroutine compute_kernel_02(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
        ! Back Substitution
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_02
    subroutine compute_kernel_03(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 02)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
        ! Back Substitution
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_03
    subroutine compute_kernel_04(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 03)
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
        ! Back Substitution
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_04
    subroutine compute_kernel_05(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 04)
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
        ! Back Substitution
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_05
    subroutine compute_kernel_06(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 05)
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        ! Back Substitution
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_06
    subroutine compute_kernel_07(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 06)
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
        ! Back Substitution
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_07
    subroutine compute_kernel_08(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 07)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_08
        ! Back Substitution
    subroutine compute_kernel_09(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 08)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_09
    subroutine compute_kernel_10(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        ! Back Substitution
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 09)
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_10
    subroutine compute_kernel_11(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        ! Back Substitution
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 10)
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_11
    subroutine compute_kernel_12(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        ! Back Substitution
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 11)
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_12
    subroutine compute_kernel_13(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
        ! Back Substitution
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 12)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_13
    subroutine compute_kernel_14(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
        ! Back Substitution
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 13)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_14
    subroutine compute_kernel_15(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
        ! Back Substitution
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_15
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 14)
    subroutine compute_kernel_16(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
        ! Back Substitution
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_16
    subroutine compute_kernel_17(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 15)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
        ! Back Substitution
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_17
    subroutine compute_kernel_18(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 16)
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
        ! Back Substitution
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_18
    subroutine compute_kernel_19(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 17)
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
        ! Back Substitution
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_19
    subroutine compute_kernel_20(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 18)
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        ! Back Substitution
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_20
    subroutine compute_kernel_21(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 19)
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
        ! Back Substitution
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_21
    subroutine compute_kernel_22(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 20)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_22
        ! Back Substitution
    subroutine compute_kernel_23(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 21)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_23
    subroutine compute_kernel_24(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        ! Back Substitution
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 22)
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_24
    subroutine compute_kernel_25(dim, matrix_in, vector_b, vector_x, condition_out)
        integer, intent(in) :: dim
        real(dp), intent(in) :: matrix_in(dim, dim)
        real(dp), intent(in) :: vector_b(dim)
        real(dp), intent(out) :: vector_x(dim)
        real(dp), intent(out) :: condition_out
        real(dp) :: a_mat(dim, dim)
        real(dp) :: factor, pivot_val, sum_val
        ! Back Substitution
        integer :: i, j, k, max_row
        a_mat = matrix_in
        vector_x = vector_b
        condition_out = 1.0_dp
        do k = 1, dim - 1
            max_row = k
            pivot_val = abs(a_mat(k, k))
            do i = k + 1, dim
                if (abs(a_mat(i, k)) > pivot_val) then
                    pivot_val = abs(a_mat(i, k))
                    max_row = i
                end if
            end do
            if (max_row /= k) then
                do j = k, dim
                    factor = a_mat(k, j)
                    a_mat(k, j) = a_mat(max_row, j)
                    a_mat(max_row, j) = factor
                end do
                factor = vector_x(k)
                vector_x(k) = vector_x(max_row)
                vector_x(max_row) = factor
            end if
            if (abs(a_mat(k, k)) < 1.0e-15_dp) then
                condition_out = 1.0e16_dp
                return
            end if
            do i = k + 1, dim
        ! Gaussian Elimination with Scaled Partial Pivoting (Kernel 23)
                factor = a_mat(i, k) / a_mat(k, k)
                do j = k + 1, dim
                    a_mat(i, j) = a_mat(i, j) - factor * a_mat(k, j)
                end do
                vector_x(i) = vector_x(i) - factor * vector_x(k)
            end do
        end do
        vector_x(dim) = vector_x(dim) / a_mat(dim, dim)
        do i = dim - 1, 1, -1
            sum_val = vector_x(i)
            do j = i + 1, dim
                sum_val = sum_val - a_mat(i, j) * vector_x(j)
            end do
            vector_x(i) = sum_val / a_mat(i, i)
        end do
    end subroutine compute_kernel_25
    subroutine run_subsystem_benchmark(matrix_dim, total_error)
        integer, intent(in) :: matrix_dim
        real(dp), intent(out) :: total_error
        real(dp), allocatable :: test_matrix(:,:)
        real(dp), allocatable :: vec_b(:), vec_x(:)
        real(dp) :: cond_val
        integer :: i, j
        allocate(test_matrix(matrix_dim, matrix_dim))
        allocate(vec_b(matrix_dim))
        allocate(vec_x(matrix_dim))
        total_error = 0.0_dp
        do i = 1, matrix_dim
            vec_b(i) = real(i, dp)
            do j = 1, matrix_dim
                if (i == j) then
                    test_matrix(i, j) = 4.0_dp
                else if (abs(i - j) == 1) then
                    test_matrix(i, j) = -1.0_dp
                else
                    test_matrix(i, j) = 0.0_dp
                end if
            end do
        end do
        call compute_kernel_01(matrix_dim, test_matrix, vec_b, vec_x, cond_val)
        do i = 1, matrix_dim
            total_error = total_error + abs(vec_x(i))
        end do
        deallocate(test_matrix, vec_b, vec_x)
    end subroutine run_subsystem_benchmark
    subroutine evaluate_numerical_kernel()
        real(dp) :: err
        call run_subsystem_benchmark(10, err)
        write(*, '(A, F12.6)') "fast_fourier_subsystem Evaluation Residual: ", err
    end subroutine evaluate_numerical_kernel
end module fast_fourier_subsystem
program main_fast_fourier_subsystem
    use fast_fourier_subsystem
    implicit none
    call evaluate_numerical_kernel()
end program main_fast_fourier_subsystem
