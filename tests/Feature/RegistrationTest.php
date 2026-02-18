<?php

// TODO: Rewrite these tests with renamed KKN models and factories
// Old model names (Student, Period, Registration) have been renamed to
// (KKN\Mahasiswa, KKN\Periode, KKN\PesertaKkn)

test('student can register for active period', function () {
    $this->markTestSkipped('Requires KKN model factories (Mahasiswa, Periode, PesertaKkn) to be created.');
});

test('student cannot register twice for the same period', function () {
    $this->markTestSkipped('Requires KKN model factories (Mahasiswa, Periode, PesertaKkn) to be created.');
});
