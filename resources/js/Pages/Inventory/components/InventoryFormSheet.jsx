import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
    Sheet, SheetContent, SheetHeader,
    SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from '@/components/ui/sheet'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import {
    Select, SelectTrigger, SelectValue,
    SelectContent, SelectItem,
} from '@/components/ui/select'
import { MED_TYPES, emptyFormValues, itemToFormValues } from '../helpers/inventoryHelpers'

function FieldError({ message }) {
    if (!message) return null
    return <p className="text-xs text-destructive mt-1">{message}</p>
}

function FormField({ label, required, error, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {children}
            <FieldError message={error} />
        </div>
    )
}

export default function InventoryFormSheet({ open, onOpenChange, editItem, onSubmit, saving }) {
    const isEdit = !!editItem

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: emptyFormValues(),
    })

    // Populate form when editing, reset when adding
    useEffect(() => {
        if (open) {
            reset(isEdit ? itemToFormValues(editItem) : emptyFormValues())
        }
    }, [open, editItem, isEdit, reset])

    const medType = watch('med_type')

    const onFormSubmit = async (data) => {
        try {
            await onSubmit({
                ...data,
                med_type: Number(data.med_type),
                qty:      Number(data.qty),
            })
            onOpenChange(false)
        } catch {
            // Error toast shown in hook
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle>{isEdit ? 'Edit Inventory Item' : 'Add New Item'}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? `Editing: ${editItem?.item_name}`
                            : 'Fill in the details to add a new item to the inventory.'}
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="flex flex-col flex-1 overflow-y-auto"
                >
                    <div className="flex-1 py-6 space-y-5">

                        {/* Item Name */}
                        <FormField label="Item Name" required error={errors.item_name?.message}>
                            <Input
                                placeholder="e.g. Paracetamol 500mg"
                                {...register('item_name', { required: 'Item name is required.' })}
                            />
                        </FormField>

                        {/* Type */}
                        <FormField label="Type" required error={errors.med_type?.message}>
                            <Select
                                value={medType}
                                onValueChange={(v) => setValue('med_type', v, { shouldValidate: true })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MED_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input
                                type="hidden"
                                {...register('med_type', { required: 'Type is required.' })}
                            />
                        </FormField>

                        {/* Brand + UOM row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Brand" error={errors.brand?.message}>
                                <Input
                                    placeholder="e.g. Generic"
                                    {...register('brand')}
                                />
                            </FormField>

                            <FormField label="Unit of Measure" error={errors.uom?.message}>
                                <Input
                                    placeholder="e.g. tablet, ml, pcs"
                                    {...register('uom')}
                                />
                            </FormField>
                        </div>

                        {/* Quantity */}
                        <FormField label="Quantity" required error={errors.qty?.message}>
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                {...register('qty', {
                                    required: 'Quantity is required.',
                                    min: { value: 0, message: 'Quantity cannot be negative.' },
                                    valueAsNumber: true,
                                })}
                            />
                        </FormField>

                        {/* Expiration date */}
                        <FormField label="Expiration Date" error={errors.expiration?.message}>
                            <Input
                                type="date"
                                {...register('expiration')}
                            />
                        </FormField>

                    </div>

                    {/* Footer */}
                    <SheetFooter className="pt-4 border-t gap-2">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                        </SheetClose>
                        <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
                            {saving
                                ? (isEdit ? 'Saving…' : 'Adding…')
                                : (isEdit ? 'Save Changes' : 'Add Item')}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
