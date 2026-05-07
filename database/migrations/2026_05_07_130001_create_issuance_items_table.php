<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('issuance_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issuance_id')->constrained('issuances')->cascadeOnDelete();
            $table->unsignedBigInteger('inventory_id'); // soft reference — don't restrict delete
            $table->string('item_name');
            $table->string('brand')->nullable();
            $table->string('uom')->nullable();
            $table->unsignedSmallInteger('med_type');
            $table->integer('qty_issued');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issuance_items');
    }
};
