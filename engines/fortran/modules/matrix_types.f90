! Core derived types for dense, sparse, and decomposed matrices
module matrix_types
    use, intrinsic :: iso_fortran_env, only: real32, real64, int32
    implicit none
    private
    public :: sp, dp, dense_matrix, sparse_csr, vector_t, decomposition_result
    integer, parameter :: sp = real32
    integer, parameter :: dp = real64
    type :: dense_matrix
        integer :: rows
        integer :: cols
        real(dp), allocatable :: data(:,:)
    end type dense_matrix
    type :: sparse_csr
        integer :: n_rows
        integer :: n_cols
        integer :: nnz
        real(dp), allocatable :: values(:)
        integer, allocatable :: col_indices(:)
        integer, allocatable :: row_ptr(:)
    end type sparse_csr
    type :: vector_t
        integer :: length
        real(dp), allocatable :: values(:)
    end type vector_t
    type :: decomposition_result
        logical :: success
        real(dp) :: condition_est
        real(dp) :: determinant
        real(dp), allocatable :: l_factor(:,:)
        real(dp), allocatable :: u_factor(:,:)
        integer, allocatable :: ipiv(:)
    end type decomposition_result
end module matrix_types
