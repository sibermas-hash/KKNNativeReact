<?php $__env->startSection('title', 'Halaman Tidak Tersedia'); ?>

<?php $__env->startSection('icon'); ?>
<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('heading', 'Halaman Tidak Tersedia'); ?>

<?php $__env->startSection('message', 'Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.'); ?>

<?php echo $__env->make('errors.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /var/www/resources/views/errors/404.blade.php ENDPATH**/ ?>