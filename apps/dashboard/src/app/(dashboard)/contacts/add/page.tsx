import {
  getAddressesForSelect,
  getContactCategories,
  getLocationsForSelect,
} from "@/app/(dashboard)/contacts/actions";
import { ContactForm } from "@/components/contacts/contact-form";

const AddContactPage = async () => {
  const [addresses, categories, locations] = await Promise.all([
    getAddressesForSelect(),
    getContactCategories(),
    getLocationsForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Contact</h1>
        <p className="mt-2 text-gray-600">Create a new contact record</p>
      </div>
      <ContactForm addresses={addresses} categories={categories} locations={locations} />
    </div>
  );
};

export default AddContactPage;
