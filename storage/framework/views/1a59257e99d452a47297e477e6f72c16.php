<?php $__env->startSection('title', 'Sesi Berakhir'); ?>

<?php $__env->startSection('icon'); ?>
<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('heading', 'Sesi Berakhir'); ?>

<?php $__env->startSection('message', 'Sesi Anda telah berakhir karena terlalu lama tidak ada aktivitas. Silakan muat ulang halaman atau login kembali.'); ?>

<?php echo $__env->make('errors.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/resources/views/errors/419.blade.php ENDPATH**/ ?>