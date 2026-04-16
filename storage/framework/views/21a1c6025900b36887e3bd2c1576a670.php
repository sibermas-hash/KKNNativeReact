<?php $__env->startSection('title', 'Akses Terbatas'); ?>

<?php $__env->startSection('icon'); ?>
<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
</svg>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('heading', 'Akses Terbatas'); ?>

<?php $__env->startSection('message'); ?>
    <?php echo e($exception->getMessage() ?: 'Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.'); ?>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('errors.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/resources/views/errors/403.blade.php ENDPATH**/ ?>