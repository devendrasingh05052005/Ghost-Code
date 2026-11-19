! Subsystem: finite_element_elasticity
module finite_element_elasticity
    use, intrinsic :: iso_fortran_env, only: real64, int32
    implicit none
    private
    public :: run_finite_element_elasticity_benchmark
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
    public :: compute_kernel_23
    public :: compute_kernel_24
    public :: compute_kernel_25
    public :: compute_kernel_26
    public :: compute_kernel_27
    public :: compute_kernel_28
    public :: compute_kernel_29
    public :: compute_kernel_30
    public :: compute_kernel_31
    public :: compute_kernel_32
    public :: compute_kernel_33
    public :: compute_kernel_34
    public :: compute_kernel_35
    public :: compute_kernel_36
    public :: compute_kernel_37
    public :: compute_kernel_38
    public :: compute_kernel_39
    public :: compute_kernel_40
contains
    subroutine run_finite_element_elasticity_benchmark(n, residual)
        integer, intent(in) :: n
        real(dp), intent(out) :: residual
        real(dp) :: acc, res
        integer :: i
        acc = 0.0_dp
        call compute_kernel_01(n, res)
        acc = acc + res
        call compute_kernel_02(n, res)
        acc = acc + res
        call compute_kernel_03(n, res)
        acc = acc + res
        call compute_kernel_04(n, res)
        acc = acc + res
        call compute_kernel_05(n, res)
        acc = acc + res
        call compute_kernel_06(n, res)
        acc = acc + res
        call compute_kernel_07(n, res)
        acc = acc + res
        call compute_kernel_08(n, res)
        acc = acc + res
        call compute_kernel_09(n, res)
        acc = acc + res
        call compute_kernel_10(n, res)
        acc = acc + res
        call compute_kernel_11(n, res)
        acc = acc + res
        call compute_kernel_12(n, res)
        acc = acc + res
        call compute_kernel_13(n, res)
        acc = acc + res
        call compute_kernel_14(n, res)
        acc = acc + res
        call compute_kernel_15(n, res)
        acc = acc + res
        call compute_kernel_16(n, res)
        acc = acc + res
        call compute_kernel_17(n, res)
        acc = acc + res
        call compute_kernel_18(n, res)
        acc = acc + res
        call compute_kernel_19(n, res)
        acc = acc + res
        call compute_kernel_20(n, res)
        acc = acc + res
        call compute_kernel_21(n, res)
        acc = acc + res
        call compute_kernel_22(n, res)
        acc = acc + res
        call compute_kernel_23(n, res)
        acc = acc + res
        call compute_kernel_24(n, res)
        acc = acc + res
        call compute_kernel_25(n, res)
        acc = acc + res
        call compute_kernel_26(n, res)
        acc = acc + res
        call compute_kernel_27(n, res)
        acc = acc + res
        call compute_kernel_28(n, res)
        acc = acc + res
        call compute_kernel_29(n, res)
        acc = acc + res
        call compute_kernel_30(n, res)
        acc = acc + res
        call compute_kernel_31(n, res)
        acc = acc + res
        call compute_kernel_32(n, res)
        acc = acc + res
        call compute_kernel_33(n, res)
        acc = acc + res
        call compute_kernel_34(n, res)
        acc = acc + res
        call compute_kernel_35(n, res)
        acc = acc + res
        call compute_kernel_36(n, res)
        acc = acc + res
        call compute_kernel_37(n, res)
        acc = acc + res
        call compute_kernel_38(n, res)
        acc = acc + res
        call compute_kernel_39(n, res)
        acc = acc + res
        call compute_kernel_40(n, res)
        acc = acc + res
        residual = acc / 40.0_dp
    end subroutine run_finite_element_elasticity_benchmark
    subroutine compute_kernel_01(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.0625_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 01 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_01
    subroutine compute_kernel_02(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.07500000000000001_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 02 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_02
    subroutine compute_kernel_03(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.08750000000000001_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 03 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_03
    subroutine compute_kernel_04(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.1_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 04 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_04
    subroutine compute_kernel_05(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.1125_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 05 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_05
    subroutine compute_kernel_06(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.125_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 06 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_06
    subroutine compute_kernel_07(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.1375_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 07 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_07
    subroutine compute_kernel_08(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.15000000000000002_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 08 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_08
    subroutine compute_kernel_09(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.1625_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 09 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_09
    subroutine compute_kernel_10(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.175_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 10 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_10
    subroutine compute_kernel_11(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.1875_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 11 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_11
    subroutine compute_kernel_12(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.2_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 12 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_12
    subroutine compute_kernel_13(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.21250000000000002_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 13 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_13
    subroutine compute_kernel_14(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.22500000000000003_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 14 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_14
    subroutine compute_kernel_15(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.2375_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 15 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_15
    subroutine compute_kernel_16(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.25_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 16 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_16
    subroutine compute_kernel_17(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.2625_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 17 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_17
    subroutine compute_kernel_18(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.275_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 18 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_18
    subroutine compute_kernel_19(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.28750000000000003_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 19 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_19
    subroutine compute_kernel_20(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.3_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 20 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_20
    subroutine compute_kernel_21(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.3125_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 21 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_21
    subroutine compute_kernel_22(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.325_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 22 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_22
    subroutine compute_kernel_23(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.3375_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 23 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_23
    subroutine compute_kernel_24(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.35000000000000003_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 24 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_24
    subroutine compute_kernel_25(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.3625_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 25 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_25
    subroutine compute_kernel_26(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.375_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 26 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_26
    subroutine compute_kernel_27(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.3875_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 27 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_27
    subroutine compute_kernel_28(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.4_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 28 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_28
    subroutine compute_kernel_29(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.41250000000000003_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 29 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_29
    subroutine compute_kernel_30(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.425_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 30 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_30
    subroutine compute_kernel_31(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.4375_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 31 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_31
    subroutine compute_kernel_32(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.45_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 32 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_32
    subroutine compute_kernel_33(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.4625_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 33 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_33
    subroutine compute_kernel_34(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.47500000000000003_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 34 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_34
    subroutine compute_kernel_35(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.4875_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 35 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_35
    subroutine compute_kernel_36(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.5_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 36 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_36
    subroutine compute_kernel_37(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.5125000000000001_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 37 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_37
    subroutine compute_kernel_38(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.525_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 38 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_38
    subroutine compute_kernel_39(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.5375000000000001_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 39 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_39
    subroutine compute_kernel_40(n, result_val)
        integer, intent(in) :: n
        real(dp), intent(out) :: result_val
        real(dp) :: vec_a(100), vec_b(100)
        real(dp) :: alpha, norm_sum
        integer :: i, j
        alpha = 0.55_dp
        norm_sum = 0.0_dp
        do i = 1, 100
            vec_a(i) = sin(real(i, dp) * alpha) * exp(-0.01_dp * real(i, dp))
            vec_b(i) = cos(real(i, dp) * alpha) * 0.5_dp
        end do
        do i = 1, 100
            do j = 1, 10
                vec_a(i) = vec_a(i) + vec_b((mod(i * j, 100)) + 1) * 0.001_dp
            end do
            norm_sum = norm_sum + vec_a(i)**2
        end do
! Mathematical Kernel 40 Numerical Convergence Evaluation
        if (norm_sum > 0.0_dp) then
            result_val = sqrt(norm_sum) * alpha
        else
            result_val = 0.0_dp
        end if
    end subroutine compute_kernel_40
end module finite_element_elasticity
