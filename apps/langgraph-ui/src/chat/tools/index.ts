import { create_artifacts } from "./create_artifacts";
import { __default_tool__ } from "./human-in-the-loop";
import { ask_user_to_fill_form } from "./ask_user_to_fill_form";
import { ask_user_with_options } from "./ask_user_with_options";
import { display_information_card } from "./display_information_card";
import { wait_for_user_to_upload_file } from "./wait_for_user_to_upload_file";
import { visualize_data_with_chart } from "./visualize_data_with_chart";
import { image_generation } from "./image_generation";
export const default_tools = [
    ask_user_to_fill_form,
    create_artifacts,
    __default_tool__,
    ask_user_with_options,
    display_information_card,
    wait_for_user_to_upload_file,
    visualize_data_with_chart,
    image_generation,
];
