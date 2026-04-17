<?php $__env->startSection('title', 'Terjadi Gangguan'); ?>

<?php $__env->startSection('icon'); ?>
<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
</svg>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('heading', 'Terjadi Gangguan'); ?>

<?php $__env->startSection('message', 'Terjadi kesalahan sistem internal. Tim teknis kami sedang memperbaikinya.'); ?>

<?php echo $__env->make('errors.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/macm4/Documents/Projek/KKN/kknuinsaizu/resources/views/errors/500.blade.php ENDPATH**/ ?>